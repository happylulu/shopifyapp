from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.status import HTTP_401_UNAUTHORIZED
import base64
import json
import hmac
import hashlib
import os

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
    except ValueError:
        raise ValueError("Invalid token")
    signing_input = f"{header_b64}.{payload_b64}".encode()
    expected_sig = hmac.new(SECRET_KEY.encode(), signing_input, hashlib.sha256).digest()
    valid_sig = base64.urlsafe_b64encode(expected_sig).rstrip(b"=").decode()
    if not hmac.compare_digest(signature_b64, valid_sig):
        raise ValueError("Invalid signature")
    payload_json = base64.urlsafe_b64decode(payload_b64 + "==").decode()
    return json.loads(payload_json)

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
        try:
            payload = decode(token)
            request.state.jwt_payload = payload
        except Exception:
            raise HTTPException(status_code=HTTP_401_UNAUTHORIZED, detail="Invalid token")

        return await call_next(request)
