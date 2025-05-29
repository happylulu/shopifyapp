"""
Simplified FastAPI app for testing authentication system
This version focuses only on the core authentication functionality
"""

from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
from pathlib import Path

# Load environment variables
def load_env():
    """Load environment variables from .env file."""
    env_path = Path(__file__).parent / ".env"
    if env_path.exists():
        with open(env_path) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    os.environ[key] = value

load_env()

# Import authentication components
from shop_context import (
    get_shop_domain,
    verify_shop_access,
    get_shop_context,
    ShopContext,
)
from session_storage import get_session_storage
from shopify_client import get_shopify_client


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    print("🚀 Starting FastAPI Authentication Test Server...")
    yield
    print("🛑 Shutting down FastAPI Authentication Test Server...")


# Create FastAPI app
app = FastAPI(
    title="Shopify Loyalty App - Authentication Test",
    description="Simplified FastAPI app for testing multi-tenant authentication",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://*.ngrok.io", "https://*.trycloudflare.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Basic endpoints
@app.get("/")
async def root():
    return {
        "message": "Shopify Loyalty App - Authentication Test API",
        "version": "1.0.0",
        "status": "running",
        "authentication": "multi-tenant"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "fastapi-auth-test"}


@app.get("/shop/info")
async def get_shop_info(
    shop_domain: str = Depends(verify_shop_access),
    shopify_client = Depends(get_shopify_client)
):
    """
    Test endpoint demonstrating the new authentication pattern.
    
    This endpoint:
    1. Extracts shop domain from the request (via JWT middleware)
    2. Verifies the shop has the app installed
    3. Uses the shop-specific access token to call Shopify API
    """
    try:
        shop_info = await shopify_client.get_shop_info(shop_domain)
        return {
            "success": True,
            "shop_domain": shop_domain,
            "shop_info": shop_info,
            "message": "Successfully authenticated with shop-specific token"
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get shop info: {str(e)}"
        )


@app.get("/shop/context")
async def get_shop_context_info(
    shop_context: ShopContext = Depends(get_shop_context)
):
    """
    Test endpoint that shows shop context information.
    """
    try:
        session_data = await shop_context.get_session_data()
        access_token = await shop_context.get_access_token()
        
        return {
            "success": True,
            "shop_domain": shop_context.shop_domain,
            "has_access_token": bool(access_token),
            "token_preview": f"{access_token[:20]}..." if access_token else None,
            "session_data": {
                "shop": session_data.get("shop") if session_data else None,
                "scope": session_data.get("scope") if session_data else None,
                "isOnline": session_data.get("isOnline") if session_data else None,
            } if session_data else None,
            "is_installed": await shop_context.is_installed()
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get shop context: {str(e)}"
        )


@app.get("/test/development")
async def test_development_mode(request: Request):
    """
    Test endpoint for development mode (no authentication required).
    """
    return {
        "success": True,
        "message": "Development mode test successful",
        "headers": dict(request.headers),
        "shop_domain": request.headers.get("X-Shopify-Shop-Domain", "Not provided"),
        "development_mode": request.headers.get("X-Development-Mode", "false")
    }


@app.get("/session/list")
async def list_sessions(session_storage = Depends(get_session_storage)):
    """
    List all shops that have the app installed.
    """
    try:
        shops = await session_storage.list_installed_shops()
        
        shop_details = []
        for shop in shops:
            token = await session_storage.get_shop_access_token(shop)
            session_data = await session_storage.get_shop_session(shop)
            
            shop_details.append({
                "shop_domain": shop,
                "has_token": bool(token),
                "token_preview": f"{token[:20]}..." if token else None,
                "created_at": session_data.get("createdAt") if session_data else None,
                "scope": session_data.get("scope") if session_data else None,
            })
        
        return {
            "success": True,
            "total_shops": len(shops),
            "shops": shop_details
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to list sessions: {str(e)}"
        )


@app.get("/debug/headers")
async def debug_headers(request: Request):
    """
    Debug endpoint to see all request headers.
    """
    return {
        "success": True,
        "headers": dict(request.headers),
        "method": request.method,
        "url": str(request.url),
        "query_params": dict(request.query_params)
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8004)
