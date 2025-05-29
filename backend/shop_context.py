"""
Shop Context Utilities for FastAPI Backend

This module provides utilities for extracting and managing shop context
in FastAPI requests. It works with the JWT middleware to ensure that
each request has the proper shop context for multi-tenant operations.
"""

from fastapi import Request, HTTPException, Depends
from typing import Optional
from session_storage import SessionStorageService, get_session_storage


def get_shop_domain_from_request(request: Request) -> str:
    """
    Extract shop domain from the request.
    
    This function tries multiple sources to get the shop domain:
    1. From the JWT middleware (Shopify session token)
    2. From request headers (X-Shopify-Shop-Domain)
    3. From query parameters (shop)
    4. From subdomain (for storefront requests)
    
    Args:
        request: The FastAPI request object
        
    Returns:
        The shop domain (e.g., 'mystore.myshopify.com')
        
    Raises:
        HTTPException: If no shop domain can be determined
    """
    # First, try to get from JWT middleware state
    shop_domain = getattr(request.state, "shop_domain", None)
    if shop_domain:
        return shop_domain
    
    # Try from headers (common for webhook requests)
    shop_domain = request.headers.get("X-Shopify-Shop-Domain")
    if shop_domain:
        return shop_domain
    
    # Try from query parameters
    shop_domain = request.query_params.get("shop")
    if shop_domain:
        return shop_domain
    
    # Try from subdomain (for storefront API requests)
    host = request.headers.get("host", "")
    if ".myshopify.com" in host:
        shop_domain = host.split(".")[0] + ".myshopify.com"
        return shop_domain
    
    # For development/testing, allow a fallback
    if request.headers.get("X-Development-Mode") == "true":
        return "demo.myshopify.com"
    
    raise HTTPException(
        status_code=400,
        detail="Shop domain not found in request. Please include shop context."
    )


async def get_shop_domain(request: Request) -> str:
    """FastAPI dependency to get shop domain from request."""
    return get_shop_domain_from_request(request)


async def verify_shop_access(
    request: Request,
    session_storage: SessionStorageService = Depends(get_session_storage)
) -> str:
    """
    FastAPI dependency that verifies the shop has the app installed.
    
    This dependency:
    1. Extracts the shop domain from the request
    2. Verifies that the shop has a valid access token (app is installed)
    3. Returns the shop domain for use in the endpoint
    
    Args:
        request: The FastAPI request object
        session_storage: The session storage service
        
    Returns:
        The verified shop domain
        
    Raises:
        HTTPException: If shop is not found or app is not installed
    """
    shop_domain = get_shop_domain_from_request(request)
    
    # Verify the shop has the app installed
    is_installed = await session_storage.is_shop_installed(shop_domain)
    if not is_installed:
        raise HTTPException(
            status_code=403,
            detail=f"App not installed for shop: {shop_domain}"
        )
    
    return shop_domain


class ShopContext:
    """
    Context object that provides shop-specific information and utilities.
    """
    
    def __init__(self, shop_domain: str, session_storage: SessionStorageService):
        self.shop_domain = shop_domain
        self.session_storage = session_storage
    
    async def get_access_token(self) -> Optional[str]:
        """Get the Shopify access token for this shop."""
        return await self.session_storage.get_shop_access_token(self.shop_domain)
    
    async def get_session_data(self) -> Optional[dict]:
        """Get the full session data for this shop."""
        return await self.session_storage.get_shop_session(self.shop_domain)
    
    async def is_installed(self) -> bool:
        """Check if the app is installed for this shop."""
        return await self.session_storage.is_shop_installed(self.shop_domain)


async def get_shop_context(
    request: Request,
    session_storage: SessionStorageService = Depends(get_session_storage)
) -> ShopContext:
    """
    FastAPI dependency that provides a complete shop context object.
    
    This is the recommended dependency for endpoints that need shop-specific
    operations, as it provides both the shop domain and access to session data.
    """
    shop_domain = await verify_shop_access(request, session_storage)
    return ShopContext(shop_domain, session_storage)


# Convenience functions for common patterns

def require_shop_domain(request: Request) -> str:
    """
    Simple function to get shop domain from request.
    Raises HTTPException if not found.
    """
    return get_shop_domain_from_request(request)


async def get_shop_access_token(
    request: Request,
    session_storage: SessionStorageService = Depends(get_session_storage)
) -> str:
    """
    FastAPI dependency that returns the shop's access token.
    Verifies the shop is installed first.
    """
    shop_domain = await verify_shop_access(request, session_storage)
    access_token = await session_storage.get_shop_access_token(shop_domain)
    
    if not access_token:
        raise HTTPException(
            status_code=500,
            detail="Access token not found for verified shop"
        )
    
    return access_token
