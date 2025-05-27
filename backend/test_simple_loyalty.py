#!/usr/bin/env python3
"""
Simple test for loyalty service without FastAPI dependency injection
"""
import asyncio
from models_v2 import init_db, async_session, Shop, CustomerLoyaltyProfile
from loyalty_service import loyalty_service
from sqlalchemy import select

async def test_loyalty_service_directly():
    """Test the loyalty service directly without FastAPI"""
    print("🧪 Testing Loyalty Service Directly")
    print("=" * 50)

    # Initialize database
    print("\n1️⃣ Initializing database...")
    await init_db()
    print("   ✅ Database initialized")

    # Create a session
    session = async_session()
    try:
        # Create a test shop
        print("\n2️⃣ Creating test shop...")
        test_shop = Shop(
            shop_domain="test.myshopify.com",
            access_token="test_token",
            loyalty_enabled=True
        )
        session.add(test_shop)
        await session.commit()
        await session.refresh(test_shop)
        print(f"   ✅ Created shop: {test_shop.shop_domain} (ID: {test_shop.id})")

        # Test creating a loyalty profile
        print("\n3️⃣ Creating loyalty profile...")
        profile = await loyalty_service.create_profile(
            session,
            test_shop.id,
            "customer123",
            email="test@example.com",
            first_name="John",
            last_name="Doe"
        )
        print(f"   ✅ Created profile: {profile.shopify_customer_id} with {profile.points_balance} points")

        # Test getting the profile
        print("\n4️⃣ Getting loyalty profile...")
        retrieved_profile = await loyalty_service.get_profile(session, test_shop.id, "customer123")
        if retrieved_profile:
            print(f"   ✅ Retrieved profile: {retrieved_profile.shopify_customer_id} - {retrieved_profile.points_balance} points")
        else:
            print("   ❌ Profile not found")

        # Test adjusting points
        print("\n5️⃣ Adjusting points...")
        updated_profile = await loyalty_service.adjust_points(
            session,
            retrieved_profile,
            100,
            "Welcome bonus"
        )
        print(f"   ✅ Points adjusted! New balance: {updated_profile.points_balance} points")

        # Test getting profile again to verify points
        print("\n6️⃣ Verifying points adjustment...")
        final_profile = await loyalty_service.get_profile(session, test_shop.id, "customer123")
        print(f"   ✅ Final balance: {final_profile.points_balance} points")

        print("\n🎉 Loyalty service testing complete!")

    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        await session.close()

if __name__ == "__main__":
    asyncio.run(test_loyalty_service_directly())
