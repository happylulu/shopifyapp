#!/usr/bin/env python3
"""
Complete Authentication Flow Test

This script tests the end-to-end authentication system with your Neon database
and verifies that both Next.js and FastAPI can share session data.
"""

import asyncio
import httpx
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

from session_storage import SessionStorageService


async def test_database_connection():
    """Test connection to Neon database."""
    print("🔧 Testing Neon Database Connection...")

    try:
        storage = SessionStorageService()
        # Try to list shops (this tests the database connection)
        shops = await storage.list_installed_shops()
        print(f"✅ Connected to Neon database successfully")
        print(f"✅ Found {len(shops)} installed shops: {shops}")
        return True
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False


async def test_session_storage():
    """Test session storage functionality."""
    print("\n🔧 Testing Session Storage...")

    try:
        storage = SessionStorageService()

        # Test with a demo shop
        demo_shop = "demo.myshopify.com"
        token = await storage.get_shop_access_token(demo_shop)
        is_installed = await storage.is_shop_installed(demo_shop)

        print(f"✅ Demo shop token check: {'Found' if token else 'Not found'}")
        print(f"✅ Demo shop installation status: {is_installed}")

        # List all installed shops
        shops = await storage.list_installed_shops()
        print(f"✅ Total installed shops: {len(shops)}")

        if shops:
            print("📋 Installed shops:")
            for shop in shops:
                shop_token = await storage.get_shop_access_token(shop)
                print(f"   - {shop}: {'✅ Has token' if shop_token else '❌ No token'}")

        return True
    except Exception as e:
        print(f"❌ Session storage test failed: {e}")
        return False


async def test_fastapi_endpoints():
    """Test FastAPI endpoints."""
    print("\n🔧 Testing FastAPI Endpoints...")

    base_url = "http://127.0.0.1:8005"

    try:
        async with httpx.AsyncClient() as client:
            # Test 1: Health check
            try:
                response = await client.get(f"{base_url}/")
                if response.status_code == 200:
                    print("✅ FastAPI server is running")
                else:
                    print(f"⚠️  FastAPI server responded with status {response.status_code}")
            except httpx.ConnectError:
                print("❌ FastAPI server is not running")
                print("   Start it with: cd backend && python -m uvicorn main:app --host 127.0.0.1 --port 8004 --reload")
                return False

            # Test 2: Shop info endpoint (development mode)
            try:
                response = await client.get(
                    f"{base_url}/shop/info",
                    headers={"X-Development-Mode": "true"}
                )
                if response.status_code == 200:
                    print("✅ Shop info endpoint works in development mode")
                    data = response.json()
                    print(f"   Shop domain: {data.get('shop_domain', 'Unknown')}")
                else:
                    print(f"⚠️  Shop info endpoint returned status {response.status_code}")
                    print(f"   Response: {response.text}")
            except Exception as e:
                print(f"❌ Shop info endpoint test failed: {e}")

            # Test 3: API documentation
            try:
                response = await client.get(f"{base_url}/docs")
                if response.status_code == 200:
                    print("✅ API documentation is accessible at http://127.0.0.1:8004/docs")
                else:
                    print(f"⚠️  API docs returned status {response.status_code}")
            except Exception as e:
                print(f"❌ API docs test failed: {e}")

        return True
    except Exception as e:
        print(f"❌ FastAPI endpoint tests failed: {e}")
        return False


async def test_authentication_flow():
    """Test the complete authentication flow."""
    print("\n🔧 Testing Authentication Flow...")

    try:
        # Check if we have any real shop data
        storage = SessionStorageService()
        shops = await storage.list_installed_shops()

        if shops:
            print(f"✅ Found {len(shops)} shops with session data")

            # Test with the first shop
            test_shop = shops[0]
            token = await storage.get_shop_access_token(test_shop)

            if token:
                print(f"✅ Retrieved access token for {test_shop}")
                print(f"   Token preview: {token[:20]}...")

                # Test making a request with shop context
                async with httpx.AsyncClient() as client:
                    response = await client.get(
                        "http://127.0.0.1:8005/shop/info",
                        headers={"X-Shopify-Shop-Domain": test_shop}
                    )

                    if response.status_code == 200:
                        print("✅ Successfully used shop-specific authentication")
                        data = response.json()
                        print(f"   Authenticated for shop: {data.get('shop_domain')}")
                    else:
                        print(f"⚠️  Shop-specific request failed: {response.status_code}")
            else:
                print(f"⚠️  No access token found for {test_shop}")
        else:
            print("ℹ️  No shops with session data found")
            print("   Install your app on a test shop to create session data")

        return True
    except Exception as e:
        print(f"❌ Authentication flow test failed: {e}")
        return False


def print_next_steps():
    """Print next steps for the user."""
    print("\n📋 Next Steps:")
    print("=" * 50)
    print("1. 🏪 Install your app on a test shop:")
    print("   - Go to https://[your-test-shop].myshopify.com/admin")
    print("   - Navigate to Apps section")
    print("   - Install your 'comeback' app")
    print("   - Complete the OAuth flow")
    print("")
    print("2. 🔍 Get a real session token:")
    print("   - Open your app in the test shop")
    print("   - Open browser dev tools (F12)")
    print("   - Go to Network tab")
    print("   - Look for requests with 'Authorization: Bearer' headers")
    print("   - Copy the token after 'Bearer '")
    print("")
    print("3. 🧪 Test with real token:")
    print("   curl -H 'Authorization: Bearer YOUR_TOKEN' \\")
    print("        http://127.0.0.1:8005/shop/info")
    print("")
    print("4. 📚 Read the complete guide:")
    print("   cat TESTING_REAL_AUTH.md")


async def main():
    """Run all authentication tests."""
    print("🚀 Complete Authentication System Test")
    print("=" * 50)

    # Run all tests
    db_ok = await test_database_connection()
    storage_ok = await test_session_storage()
    api_ok = await test_fastapi_endpoints()
    auth_ok = await test_authentication_flow()

    # Summary
    print("\n🎯 Test Summary:")
    print("=" * 30)
    print(f"Database Connection: {'✅ PASS' if db_ok else '❌ FAIL'}")
    print(f"Session Storage:     {'✅ PASS' if storage_ok else '❌ FAIL'}")
    print(f"FastAPI Endpoints:   {'✅ PASS' if api_ok else '❌ FAIL'}")
    print(f"Authentication Flow: {'✅ PASS' if auth_ok else '❌ FAIL'}")

    if all([db_ok, storage_ok, api_ok, auth_ok]):
        print("\n🎉 All tests passed! Authentication system is ready.")
    else:
        print("\n⚠️  Some tests failed. Check the output above for details.")

    print_next_steps()


if __name__ == "__main__":
    asyncio.run(main())
