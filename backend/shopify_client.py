"""
Shopify API Client Service for FastAPI Backend

This service provides a secure way for FastAPI to make authenticated requests
to the Shopify Admin API using shop-specific access tokens retrieved from
the shared session storage.

Each shop that installs the app gets its own unique access token, which is
stored during the OAuth flow handled by the Next.js frontend.
"""

import os
import httpx
from typing import Optional, Dict, Any, List
from session_storage import SessionStorageService, session_storage


class ShopifyAPIError(Exception):
    """Custom exception for Shopify API errors."""
    
    def __init__(self, message: str, status_code: Optional[int] = None, response_data: Optional[Dict] = None):
        self.message = message
        self.status_code = status_code
        self.response_data = response_data
        super().__init__(self.message)


class ShopifyClient:
    """
    Client for making authenticated requests to the Shopify Admin API.
    
    This client automatically retrieves the correct access token for each shop
    from the session storage and handles authentication for API requests.
    """
    
    def __init__(self, session_storage_service: SessionStorageService):
        self.session_storage = session_storage_service
        self.api_version = "2024-10"  # Use latest stable API version
    
    async def _get_headers(self, shop_domain: str) -> Dict[str, str]:
        """Get authenticated headers for a specific shop."""
        access_token = await self.session_storage.get_shop_access_token(shop_domain)
        
        if not access_token:
            raise ShopifyAPIError(f"No access token found for shop: {shop_domain}")
        
        return {
            "X-Shopify-Access-Token": access_token,
            "Content-Type": "application/json",
            "Accept": "application/json",
        }
    
    def _get_api_url(self, shop_domain: str, endpoint: str) -> str:
        """Construct the full API URL for a shop and endpoint."""
        # Remove protocol if present
        shop_domain = shop_domain.replace("https://", "").replace("http://", "")
        
        # Ensure .myshopify.com suffix
        if not shop_domain.endswith(".myshopify.com"):
            if "." not in shop_domain:
                shop_domain = f"{shop_domain}.myshopify.com"
        
        # Remove leading slash from endpoint
        endpoint = endpoint.lstrip("/")
        
        return f"https://{shop_domain}/admin/api/{self.api_version}/{endpoint}"
    
    async def get(self, shop_domain: str, endpoint: str, params: Optional[Dict] = None) -> Dict[str, Any]:
        """Make a GET request to the Shopify Admin API."""
        url = self._get_api_url(shop_domain, endpoint)
        headers = await self._get_headers(shop_domain)
        
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=headers, params=params or {})
            
            if response.status_code == 200:
                return response.json()
            else:
                raise ShopifyAPIError(
                    f"GET {endpoint} failed: {response.status_code}",
                    status_code=response.status_code,
                    response_data=response.json() if response.content else None
                )
    
    async def post(self, shop_domain: str, endpoint: str, data: Optional[Dict] = None) -> Dict[str, Any]:
        """Make a POST request to the Shopify Admin API."""
        url = self._get_api_url(shop_domain, endpoint)
        headers = await self._get_headers(shop_domain)
        
        async with httpx.AsyncClient() as client:
            response = await client.post(url, headers=headers, json=data or {})
            
            if response.status_code in [200, 201]:
                return response.json()
            else:
                raise ShopifyAPIError(
                    f"POST {endpoint} failed: {response.status_code}",
                    status_code=response.status_code,
                    response_data=response.json() if response.content else None
                )
    
    async def put(self, shop_domain: str, endpoint: str, data: Optional[Dict] = None) -> Dict[str, Any]:
        """Make a PUT request to the Shopify Admin API."""
        url = self._get_api_url(shop_domain, endpoint)
        headers = await self._get_headers(shop_domain)
        
        async with httpx.AsyncClient() as client:
            response = await client.put(url, headers=headers, json=data or {})
            
            if response.status_code == 200:
                return response.json()
            else:
                raise ShopifyAPIError(
                    f"PUT {endpoint} failed: {response.status_code}",
                    status_code=response.status_code,
                    response_data=response.json() if response.content else None
                )
    
    async def delete(self, shop_domain: str, endpoint: str) -> bool:
        """Make a DELETE request to the Shopify Admin API."""
        url = self._get_api_url(shop_domain, endpoint)
        headers = await self._get_headers(shop_domain)
        
        async with httpx.AsyncClient() as client:
            response = await client.delete(url, headers=headers)
            
            if response.status_code in [200, 204]:
                return True
            else:
                raise ShopifyAPIError(
                    f"DELETE {endpoint} failed: {response.status_code}",
                    status_code=response.status_code,
                    response_data=response.json() if response.content else None
                )
    
    # Convenience methods for common Shopify operations
    
    async def get_shop_info(self, shop_domain: str) -> Dict[str, Any]:
        """Get shop information."""
        return await self.get(shop_domain, "shop.json")
    
    async def get_customers(self, shop_domain: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Get customers for a shop."""
        response = await self.get(shop_domain, "customers.json", {"limit": limit})
        return response.get("customers", [])
    
    async def get_customer(self, shop_domain: str, customer_id: int) -> Dict[str, Any]:
        """Get a specific customer."""
        response = await self.get(shop_domain, f"customers/{customer_id}.json")
        return response.get("customer", {})
    
    async def create_discount_code(self, shop_domain: str, price_rule_id: int, discount_data: Dict) -> Dict[str, Any]:
        """Create a discount code for a price rule."""
        response = await self.post(shop_domain, f"price_rules/{price_rule_id}/discount_codes.json", {
            "discount_code": discount_data
        })
        return response.get("discount_code", {})
    
    async def get_orders(self, shop_domain: str, limit: int = 50, status: str = "any") -> List[Dict[str, Any]]:
        """Get orders for a shop."""
        response = await self.get(shop_domain, "orders.json", {"limit": limit, "status": status})
        return response.get("orders", [])


# Global instance
shopify_client = ShopifyClient(session_storage)


async def get_shopify_client() -> ShopifyClient:
    """Dependency for FastAPI endpoints to get the Shopify client."""
    return shopify_client
