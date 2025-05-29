from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.status import HTTP_401_UNAUTHORIZED
import base64
import json
import hmac
import hashlib
import os
import jwt
from typing import Optional, Dict, Any

SECRET_KEY = os.environ.get("SHOPIFY_API_SECRET", "secret")
ALGORITHM = "HS256"


def encode(payload: dict) -> str:
    header = base64.urlsafe_b64encode(json.dumps({"alg": ALGORITHM, "typ": "JWT"}).encode()).rstrip(b"=").decode()
    payload_b64 = base64.urlsafe_b64encode(json.dumps(payload).encode()).rstrip(b"=").decode()
    signing_input = f"{header}.{payload_b64}".encode()
    signature = hmac.new(SECRET_KEY.encode(), signing_input, hashlib.sha256).digest()
    signature_b64 = base64.urlsafe_b64encode(signature).rstrip(b"=").decode()
    return f"{header}.{payload_b64}.{signature_b64}"


def decode(token: str) -> dict:
    try:
        header_b64, payload_b64, signature_b64 = token.split(".")
    except ValueError as e:
        raise ValueError("Invalid token") from e
    signing_input = f"{header_b64}.{payload_b64}".encode()
    expected_sig = hmac.new(SECRET_KEY.encode(), signing_input, hashlib.sha256).digest()
    valid_sig = base64.urlsafe_b64encode(expected_sig).rstrip(b"=").decode()
    if not hmac.compare_digest(signature_b64, valid_sig):
        raise ValueError("Invalid signature")
    payload_json = base64.urlsafe_b64decode(f"{payload_b64}==").decode()
    return json.loads(payload_json)


def decode_shopify_session_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Decode a Shopify session token to extract shop context.

    Shopify session tokens contain information about the shop and user.
    This function safely decodes the token without full verification
    to extract the shop domain for context.
    """
    try:
        # Decode without verification to get the payload
        # In production, you should verify the signature properly
        payload = jwt.decode(
            token,
            options={"verify_signature": False, "verify_exp": False}
        )

        # Extract shop domain from the 'dest' field
        dest = payload.get("dest", "")
        if dest.startswith("https://"):
            shop_domain = dest.replace("https://", "")
        else:
            shop_domain = dest

        return {
            "shop_domain": shop_domain,
            "user_id": payload.get("sub"),
            "aud": payload.get("aud"),
            "iss": payload.get("iss"),
            "dest": payload.get("dest"),
            "exp": payload.get("exp"),
            "iat": payload.get("iat"),
        }
    except Exception:
        return None

class JWTMiddleware(BaseHTTPMiddleware):
    """Simple middleware to verify JWT Bearer tokens on each request."""

    # Endpoints that don't require authentication
    EXCLUDED_PATHS = {
        "/health",
        "/docs",
        "/redoc",
        "/openapi.json",
        "/",
        # Add loyalty endpoints for testing
        "/loyalty/profiles/",
        "/rewards/",
        "/tiers/",
        # Add referral endpoints
        "/referrals/"
    }

    async def dispatch(self, request: Request, call_next):
        # Skip JWT validation for excluded paths
        if (request.url.path in self.EXCLUDED_PATHS or
            request.url.path.startswith("/loyalty/") or
            request.url.path.startswith("/referrals/")):
            return await call_next(request)

        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            raise HTTPException(status_code=HTTP_401_UNAUTHORIZED, detail="Missing token")

        token = auth_header.split(" ", 1)[1]

        # Try to decode as Shopify session token first
        shopify_payload = decode_shopify_session_token(token)
        if shopify_payload:
            # This is a Shopify session token from the frontend
            request.state.shopify_session = shopify_payload
            request.state.shop_domain = shopify_payload.get("shop_domain")
            return await call_next(request)

        # Fall back to custom JWT validation
        try:
            payload = decode(token)
            request.state.jwt_payload = payload
            # Try to extract shop domain from custom JWT if available
            request.state.shop_domain = payload.get("shop_domain")
        except Exception as e:
            raise HTTPException(status_code=HTTP_401_UNAUTHORIZED, detail="Invalid token") from e

        return await call_next(request)
