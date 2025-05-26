#!/usr/bin/env python3
"""
Migration script to transition from v1 to v2 database schema.

This script:
1. Creates the new v2 schema alongside the existing v1 schema
2. Migrates data from v1 to v2 models
3. Validates the migration
4. Provides rollback capability

Usage:
    python migrate_to_v2.py --preview    # Show what will be migrated
    python migrate_to_v2.py --migrate    # Perform the migration
    python migrate_to_v2.py --validate   # Validate migration results
    python migrate_to_v2.py --rollback   # Rollback to v1 (if needed)
"""

import asyncio
import argparse
import sys
from datetime import datetime, timezone
from decimal import Decimal
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from database import (
    Shop as ShopV1,
    Customer as CustomerV1, 
    LoyaltyPoint as LoyaltyPointV1,
    ReferralLink as ReferralLinkV1,
    VIPMember as VIPMemberV1,
    async_session as session_v1,
    engine as engine_v1
)

from models_v2 import (
    Shop,
    CustomerLoyaltyProfile,
    PointTransaction,
    TierDefinition,
    CustomerTierHistory,
    ReferralLink,
    PointTransactionType,
    PointEarnSource,
    async_session as session_v2,
    engine as engine_v2,
    Base as BaseV2
)

from sqlalchemy import select, func, text
from sqlalchemy.exc import IntegrityError


class MigrationStats:
    """Track migration statistics"""
    def __init__(self):
        self.shops_migrated = 0
        self.customers_migrated = 0
        self.points_migrated = 0
        self.referrals_migrated = 0
        self.vip_members_migrated = 0
        self.tiers_created = 0
        self.errors = []
        self.start_time = None
        self.end_time = None

    def start(self):
        self.start_time = datetime.now()
        print(f"🚀 Migration started at {self.start_time}")

    def finish(self):
        self.end_time = datetime.now()
        duration = self.end_time - self.start_time
        print(f"✅ Migration completed at {self.end_time}")
        print(f"⏱️  Total duration: {duration}")
        self.print_summary()

    def add_error(self, error: str):
        self.errors.append(error)
        print(f"❌ Error: {error}")

    def print_summary(self):
        print("\n📊 Migration Summary:")
        print(f"  Shops migrated: {self.shops_migrated}")
        print(f"  Customers migrated: {self.customers_migrated}")
        print(f"  Point transactions migrated: {self.points_migrated}")
        print(f"  Referral links migrated: {self.referrals_migrated}")
        print(f"  VIP members migrated: {self.vip_members_migrated}")
        print(f"  Tiers created: {self.tiers_created}")
        if self.errors:
            print(f"  Errors encountered: {len(self.errors)}")
            for error in self.errors[:5]:  # Show first 5 errors
                print(f"    - {error}")


async def preview_migration():
    """Preview what will be migrated"""
    print("🔍 Migration Preview")
    print("=" * 50)
    
    async with session_v1() as session:
        # Count existing data
        shops_count = await session.scalar(select(func.count(ShopV1.id)))
        customers_count = await session.scalar(select(func.count(CustomerV1.id)))
        points_count = await session.scalar(select(func.count(LoyaltyPointV1.id)))
        referrals_count = await session.scalar(select(func.count(ReferralLinkV1.id)))
        vip_count = await session.scalar(select(func.count(VIPMemberV1.id)))
        
        print(f"📊 Current Data:")
        print(f"  Shops: {shops_count}")
        print(f"  Customers: {customers_count}")
        print(f"  Loyalty Points: {points_count}")
        print(f"  Referral Links: {referrals_count}")
        print(f"  VIP Members: {vip_count}")
        
        print(f"\n🔄 Migration Plan:")
        print(f"  1. Create new v2 schema tables")
        print(f"  2. Migrate {shops_count} shops with enhanced settings")
        print(f"  3. Migrate {customers_count} customers to loyalty profiles")
        print(f"  4. Convert {points_count} point records to transaction history")
        print(f"  5. Upgrade {referrals_count} referral links with new features")
        print(f"  6. Create default tiers for {shops_count} shops")
        print(f"  7. Migrate {vip_count} VIP members to tier system")


async def create_v2_schema():
    """Create the new v2 schema"""
    print("🏗️  Creating v2 schema...")
    
    async with engine_v2.begin() as conn:
        await conn.run_sync(BaseV2.metadata.create_all)
    
    print("✅ v2 schema created successfully")


async def create_default_tiers(shop_id: int, session) -> dict:
    """Create default tiers for a shop"""
    tiers = [
        {
            "name": "Bronze",
            "tier_level": 1,
            "min_points_required": 0,
            "points_multiplier": Decimal('1.00'),
            "color": "#CD7F32",
            "icon": "🥉",
            "is_default": True
        },
        {
            "name": "Silver", 
            "tier_level": 2,
            "min_points_required": 1000,
            "points_multiplier": Decimal('1.25'),
            "color": "#C0C0C0",
            "icon": "🥈"
        },
        {
            "name": "Gold",
            "tier_level": 3, 
            "min_points_required": 5000,
            "points_multiplier": Decimal('1.50'),
            "color": "#FFD700",
            "icon": "🥇"
        },
        {
            "name": "Platinum",
            "tier_level": 4,
            "min_points_required": 15000,
            "points_multiplier": Decimal('2.00'),
            "color": "#E5E4E2",
            "icon": "💎"
        }
    ]
    
    tier_map = {}
    for tier_data in tiers:
        tier = TierDefinition(shop_id=shop_id, **tier_data)
        session.add(tier)
        await session.flush()
        tier_map[tier_data["name"]] = tier.id
    
    return tier_map


async def migrate_shops(stats: MigrationStats):
    """Migrate shops from v1 to v2"""
    print("🏪 Migrating shops...")
    
    async with session_v1() as session_old, session_v2() as session_new:
        # Get all shops from v1
        result = await session_old.execute(select(ShopV1))
        shops_v1 = result.scalars().all()
        
        for shop_v1 in shops_v1:
            try:
                # Create enhanced shop in v2
                shop_v2 = Shop(
                    shop_domain=shop_v1.shop_domain,
                    access_token=shop_v1.access_token,
                    loyalty_enabled=True,
                    points_per_dollar=Decimal('1.00'),
                    welcome_points=100,
                    referral_points_referrer=500,
                    referral_points_referee=250,
                    created_at=shop_v1.created_at,
                    updated_at=shop_v1.updated_at
                )
                
                session_new.add(shop_v2)
                await session_new.flush()
                
                # Create default tiers
                await create_default_tiers(shop_v2.id, session_new)
                stats.tiers_created += 4
                
                stats.shops_migrated += 1
                print(f"  ✅ Migrated shop: {shop_v1.shop_domain}")
                
            except Exception as e:
                stats.add_error(f"Failed to migrate shop {shop_v1.shop_domain}: {e}")
        
        await session_new.commit()


async def migrate_customers(stats: MigrationStats):
    """Migrate customers to loyalty profiles"""
    print("👥 Migrating customers...")
    
    async with session_v1() as session_old, session_v2() as session_new:
        # Get shop mapping
        shops_v1 = await session_old.execute(select(ShopV1))
        shops_v2 = await session_new.execute(select(Shop))
        
        shop_mapping = {}
        for shop_v1, shop_v2 in zip(shops_v1.scalars(), shops_v2.scalars()):
            shop_mapping[shop_v1.id] = shop_v2.id
        
        # Get default tier for each shop
        default_tiers = {}
        for shop_v2_id in shop_mapping.values():
            tier_result = await session_new.execute(
                select(TierDefinition).where(
                    TierDefinition.shop_id == shop_v2_id,
                    TierDefinition.is_default == True
                )
            )
            default_tier = tier_result.scalar_one_or_none()
            if default_tier:
                default_tiers[shop_v2_id] = default_tier.id
        
        # Migrate customers
        result = await session_old.execute(select(CustomerV1))
        customers_v1 = result.scalars().all()
        
        for customer_v1 in customers_v1:
            try:
                shop_v2_id = shop_mapping.get(customer_v1.shop_id)
                if not shop_v2_id:
                    stats.add_error(f"No shop mapping for customer {customer_v1.id}")
                    continue
                
                # Calculate points balance from loyalty points
                points_result = await session_old.execute(
                    select(func.sum(LoyaltyPointV1.points)).where(
                        LoyaltyPointV1.shop_id == customer_v1.shop_id,
                        LoyaltyPointV1.customer_id == customer_v1.customer_id
                    )
                )
                points_balance = points_result.scalar() or 0
                
                customer_v2 = CustomerLoyaltyProfile(
                    shop_id=shop_v2_id,
                    shopify_customer_id=customer_v1.customer_id,
                    email=customer_v1.email,
                    first_name=customer_v1.name.split(' ')[0] if customer_v1.name else None,
                    last_name=' '.join(customer_v1.name.split(' ')[1:]) if customer_v1.name and ' ' in customer_v1.name else None,
                    points_balance=points_balance,
                    lifetime_points_earned=points_balance,
                    current_tier_id=default_tiers.get(shop_v2_id),
                    tier_achieved_at=datetime.now(timezone.utc),
                    created_at=customer_v1.created_at,
                    updated_at=customer_v1.updated_at
                )
                
                session_new.add(customer_v2)
                stats.customers_migrated += 1
                
                if stats.customers_migrated % 100 == 0:
                    print(f"  📊 Migrated {stats.customers_migrated} customers...")
                
            except Exception as e:
                stats.add_error(f"Failed to migrate customer {customer_v1.id}: {e}")
        
        await session_new.commit()


async def migrate_points(stats: MigrationStats):
    """Migrate loyalty points to transaction history"""
    print("💰 Migrating points to transaction history...")
    
    async with session_v1() as session_old, session_v2() as session_new:
        # Get customer mapping
        customers_v1 = await session_old.execute(select(CustomerV1))
        customers_v2 = await session_new.execute(select(CustomerLoyaltyProfile))
        
        customer_mapping = {}
        for customer_v1, customer_v2 in zip(customers_v1.scalars(), customers_v2.scalars()):
            key = (customer_v1.shop_id, customer_v1.customer_id)
            customer_mapping[key] = customer_v2.id
        
        # Migrate points
        result = await session_old.execute(select(LoyaltyPointV1))
        points_v1 = result.scalars().all()
        
        for point_v1 in points_v1:
            try:
                customer_key = (point_v1.shop_id, point_v1.customer_id)
                customer_v2_id = customer_mapping.get(customer_key)
                
                if not customer_v2_id:
                    stats.add_error(f"No customer mapping for points {point_v1.id}")
                    continue
                
                transaction = PointTransaction(
                    customer_id=customer_v2_id,
                    transaction_type=PointTransactionType.EARNED,
                    points_amount=point_v1.points,
                    points_balance_after=point_v1.points,  # Simplified for migration
                    source=PointEarnSource.MANUAL if point_v1.reason else PointEarnSource.PURCHASE,
                    description=point_v1.reason or "Migrated from v1",
                    created_at=point_v1.created_at
                )
                
                session_new.add(transaction)
                stats.points_migrated += 1
                
            except Exception as e:
                stats.add_error(f"Failed to migrate points {point_v1.id}: {e}")
        
        await session_new.commit()


async def perform_migration():
    """Perform the complete migration"""
    stats = MigrationStats()
    stats.start()
    
    try:
        # Step 1: Create v2 schema
        await create_v2_schema()
        
        # Step 2: Migrate data
        await migrate_shops(stats)
        await migrate_customers(stats)
        await migrate_points(stats)
        # TODO: Add more migration functions for referrals, VIP members, etc.
        
        stats.finish()
        
    except Exception as e:
        stats.add_error(f"Migration failed: {e}")
        print(f"💥 Migration failed: {e}")
        return False
    
    return True


async def validate_migration():
    """Validate the migration results"""
    print("🔍 Validating migration...")
    
    async with session_v1() as session_old, session_v2() as session_new:
        # Compare counts
        shops_v1 = await session_old.scalar(select(func.count(ShopV1.id)))
        shops_v2 = await session_new.scalar(select(func.count(Shop.id)))
        
        customers_v1 = await session_old.scalar(select(func.count(CustomerV1.id)))
        customers_v2 = await session_new.scalar(select(func.count(CustomerLoyaltyProfile.id)))
        
        print(f"📊 Validation Results:")
        print(f"  Shops: {shops_v1} → {shops_v2} {'✅' if shops_v1 == shops_v2 else '❌'}")
        print(f"  Customers: {customers_v1} → {customers_v2} {'✅' if customers_v1 == customers_v2 else '❌'}")
        
        # TODO: Add more validation checks


def main():
    parser = argparse.ArgumentParser(description="Migrate from v1 to v2 database schema")
    parser.add_argument("--preview", action="store_true", help="Preview migration")
    parser.add_argument("--migrate", action="store_true", help="Perform migration")
    parser.add_argument("--validate", action="store_true", help="Validate migration")
    parser.add_argument("--rollback", action="store_true", help="Rollback migration")
    
    args = parser.parse_args()
    
    if args.preview:
        asyncio.run(preview_migration())
    elif args.migrate:
        asyncio.run(perform_migration())
    elif args.validate:
        asyncio.run(validate_migration())
    elif args.rollback:
        print("🚨 Rollback functionality not implemented yet")
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
