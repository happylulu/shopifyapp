#!/usr/bin/env python3
"""
Setup test data for the loyalty system
"""
import asyncio
from models_v2 import async_session, Shop, RewardDefinition, TierDefinition, CustomerLoyaltyProfile
from sqlalchemy import select

async def setup_test_data():
    session = async_session()
    try:
        print("🔧 Setting up test data...")

        # Get or create demo shop
        result = await session.execute(select(Shop).where(Shop.shop_domain == 'demo.myshopify.com'))
        shop = result.scalar_one_or_none()

        if not shop:
            shop = Shop(
                shop_domain='demo.myshopify.com',
                access_token='test_token',
                loyalty_enabled=True
            )
            session.add(shop)
            await session.commit()
            await session.refresh(shop)
            print(f"✅ Created demo shop: {shop.shop_domain}")
        else:
            print(f"✅ Found existing shop: {shop.shop_domain}")

        # Check and create rewards
        result = await session.execute(select(RewardDefinition).where(RewardDefinition.shop_id == shop.id))
        rewards = result.scalars().all()
        print(f"📦 Found {len(rewards)} existing rewards")

        if len(rewards) == 0:
            test_rewards = [
                RewardDefinition(
                    shop_id=shop.id,
                    name='10% Discount',
                    description='Get 10% off your next purchase',
                    reward_type='discount',
                    points_cost=100,
                    is_active=True
                ),
                RewardDefinition(
                    shop_id=shop.id,
                    name='Free Shipping',
                    description='Free shipping on your next order',
                    reward_type='free_shipping',
                    points_cost=75,
                    is_active=True
                ),
                RewardDefinition(
                    shop_id=shop.id,
                    name='Premium Sample',
                    description='Get a free sample of our premium products',
                    reward_type='product',
                    points_cost=200,
                    is_active=True
                )
            ]

            for reward in test_rewards:
                session.add(reward)

            await session.commit()
            print(f"✅ Created {len(test_rewards)} test rewards")

        # Check and create tiers
        result = await session.execute(select(TierDefinition).where(TierDefinition.shop_id == shop.id))
        tiers = result.scalars().all()
        print(f"🏆 Found {len(tiers)} existing tiers")

        if len(tiers) == 0:
            test_tiers = [
                TierDefinition(
                    shop_id=shop.id,
                    name='Bronze',
                    tier_level=1,
                    min_points_required=0,
                    description='Entry level tier'
                ),
                TierDefinition(
                    shop_id=shop.id,
                    name='Silver',
                    tier_level=2,
                    min_points_required=1000,
                    description='Mid-tier with enhanced benefits'
                ),
                TierDefinition(
                    shop_id=shop.id,
                    name='Gold',
                    tier_level=3,
                    min_points_required=2500,
                    description='Premium tier with VIP treatment'
                )
            ]

            for tier in test_tiers:
                session.add(tier)

            await session.commit()
            print(f"✅ Created {len(test_tiers)} test tiers")

        # Check and create test customer
        result = await session.execute(
            select(CustomerLoyaltyProfile).where(
                CustomerLoyaltyProfile.shop_id == shop.id,
                CustomerLoyaltyProfile.shopify_customer_id == 'customer123'
            )
        )
        customer = result.scalar_one_or_none()

        if not customer:
            customer = CustomerLoyaltyProfile(
                shop_id=shop.id,
                shopify_customer_id='customer123',
                email='john@example.com',
                first_name='John',
                last_name='Doe',
                points_balance=1250,
                lifetime_points_earned=2500,
                lifetime_points_redeemed=1250
            )
            session.add(customer)
            await session.commit()
            print("✅ Created test customer profile")
        else:
            print("✅ Found existing test customer")

        print("🎉 Test data setup complete!")

    except Exception as e:
        print(f"❌ Error setting up test data: {e}")
        import traceback
        traceback.print_exc()
    finally:
        await session.close()

if __name__ == "__main__":
    asyncio.run(setup_test_data())
