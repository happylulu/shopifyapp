#!/usr/bin/env python3
"""
Test script for the new authentication system.

This script tests the multi-tenant authentication architecture
to ensure shop-specific tokens are properly retrieved and used.
"""

import asyncio
import os
from pathlib import Path

# Load environment variables from .env file
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

# Load environment before importing other modules
load_env()

from session_storage import SessionStorageService
from shopify_client import ShopifyClient
from shop_context import get_shop_domain_from_request
from unittest.mock import Mock


async def test_session_storage():
    """Test the session storage service."""
    print("🔧 Testing Session Storage Service...")

    try:
        session_storage = SessionStorageService()

        # Test getting access token for a shop
        try:
            token = await session_storage.get_shop_access_token("demo.myshopify.com")
            if token:
                print(f"✅ Found access token for demo shop: {token[:20]}...")
            else:
                print("ℹ️  No access token found for demo shop (this is expected if not set up)")

            # Test checking if shop is installed
            is_installed = await session_storage.is_shop_installed("demo.myshopify.com")
            print(f"✅ Shop installation status: {is_installed}")

            # Test listing installed shops
            shops = await session_storage.list_installed_shops()
            print(f"✅ Found {len(shops)} installed shops: {shops}")

        except Exception as e:
            print(f"❌ Session storage operations failed: {e}")

    except ValueError as e:
        print(f"⚠️  Session storage initialization failed: {e}")
        print("ℹ️  This is expected if DATABASE_URL is not configured")
    except Exception as e:
        print(f"❌ Session storage test failed: {e}")


async def test_shopify_client():
    """Test the Shopify API client."""
    print("\n🔧 Testing Shopify API Client...")

    try:
        session_storage = SessionStorageService()
        shopify_client = ShopifyClient(session_storage)

        try:
            # Test with demo shop (will fail if no token, which is expected)
            shop_domain = "demo.myshopify.com"

            # Check if we have a token first
            token = await session_storage.get_shop_access_token(shop_domain)
            if token:
                print(f"✅ Found token for {shop_domain}, testing API call...")
                try:
                    shop_info = await shopify_client.get_shop_info(shop_domain)
                    print(f"✅ Successfully retrieved shop info: {shop_info.get('shop', {}).get('name', 'Unknown')}")
                except Exception as api_error:
                    print(f"⚠️  API call failed (expected if token is invalid): {api_error}")
            else:
                print(f"ℹ️  No token found for {shop_domain}, skipping API test")

        except Exception as e:
            print(f"❌ Shopify client operations failed: {e}")

    except ValueError as e:
        print(f"⚠️  Shopify client initialization failed: {e}")
        print("ℹ️  This is expected if DATABASE_URL is not configured")
    except Exception as e:
        print(f"❌ Shopify client test failed: {e}")


def test_shop_context():
    """Test shop context extraction."""
    print("\n🔧 Testing Shop Context Extraction...")

    # Mock request with different scenarios
    scenarios = [
        {
            "name": "JWT middleware state",
            "state": {"shop_domain": "test1.myshopify.com"},
            "headers": {},
            "query": {},
            "expected": "test1.myshopify.com"
        },
        {
            "name": "Header-based",
            "state": {},
            "headers": {"X-Shopify-Shop-Domain": "test2.myshopify.com"},
            "query": {},
            "expected": "test2.myshopify.com"
        },
        {
            "name": "Query parameter",
            "state": {},
            "headers": {},
            "query": {"shop": "test3.myshopify.com"},
            "expected": "test3.myshopify.com"
        },
        {
            "name": "Development mode",
            "state": {},
            "headers": {"X-Development-Mode": "true"},
            "query": {},
            "expected": "demo.myshopify.com"
        }
    ]

    for scenario in scenarios:
        try:
            # Create mock request
            mock_request = Mock()
            mock_request.state = Mock()

            # Set up state
            for key, value in scenario["state"].items():
                setattr(mock_request.state, key, value)

            # Set up headers
            mock_request.headers = Mock()
            mock_request.headers.get = lambda key, default=None: scenario["headers"].get(key, default)

            # Set up query params
            mock_request.query_params = Mock()
            mock_request.query_params.get = lambda key, default=None: scenario["query"].get(key, default)

            # Test extraction
            shop_domain = get_shop_domain_from_request(mock_request)

            if shop_domain == scenario["expected"]:
                print(f"✅ {scenario['name']}: {shop_domain}")
            else:
                print(f"❌ {scenario['name']}: expected {scenario['expected']}, got {shop_domain}")

        except Exception as e:
            print(f"❌ {scenario['name']} failed: {e}")


async def test_database_connection():
    """Test database connection."""
    print("\n🔧 Testing Database Connection...")

    try:
        from session_storage import session_engine
        from sqlalchemy import text

        # Test basic connection
        async with session_engine.begin() as conn:
            result = await conn.execute(text("SELECT 1 as test"))
            row = result.fetchone()
            if row and row[0] == 1:
                print("✅ Database connection successful")
            else:
                print("❌ Database connection test failed")

    except ValueError as e:
        print(f"⚠️  Database connection failed: {e}")
        print("ℹ️  This is expected if DATABASE_URL is not configured")
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        print("ℹ️  Make sure DATABASE_URL is set and database is running")


async def main():
    """Run all tests."""
    print("🚀 Testing Multi-Tenant Authentication System\n")

    # Check environment
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("⚠️  DATABASE_URL not set, some tests may fail")
    else:
        print(f"✅ DATABASE_URL configured: {db_url[:50]}...")

    # Run tests
    await test_database_connection()
    await test_session_storage()
    await test_shopify_client()
    test_shop_context()

    print("\n🎉 Authentication system tests completed!")
    print("\n📚 Next steps:")
    print("1. Set up a test shop with valid session data")
    print("2. Test with real Shopify session tokens from your Next.js app")
    print("3. Verify multi-tenant isolation with multiple shops")


if __name__ == "__main__":
    asyncio.run(main())
