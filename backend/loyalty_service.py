from datetime import datetime
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models_v2 import (
    CustomerLoyaltyProfile,
    PointTransaction,
    PointTransactionType,
    PointEarnSource,
)


class LoyaltyService:
    """Business logic for loyalty operations."""

    async def create_profile(
        self, session: AsyncSession, shop_id: int, shopify_customer_id: str, email: Optional[str] = None,
        first_name: Optional[str] = None, last_name: Optional[str] = None
    ) -> CustomerLoyaltyProfile:
        profile = CustomerLoyaltyProfile(
            shop_id=shop_id,
            shopify_customer_id=shopify_customer_id,
            email=email,
            first_name=first_name,
            last_name=last_name,
        )
        session.add(profile)
        await session.commit()
        await session.refresh(profile)
        return profile

    async def get_profile(
        self, session: AsyncSession, shop_id: int, shopify_customer_id: str
    ) -> Optional[CustomerLoyaltyProfile]:
        result = await session.execute(
            select(CustomerLoyaltyProfile).where(
                CustomerLoyaltyProfile.shop_id == shop_id,
                CustomerLoyaltyProfile.shopify_customer_id == shopify_customer_id,
            )
        )
        return result.scalar_one_or_none()

    async def adjust_points(
        self,
        session: AsyncSession,
        profile: CustomerLoyaltyProfile,
        amount: int,
        reason: str = "adjustment",
    ) -> CustomerLoyaltyProfile:
        new_balance = profile.points_balance + amount
        if new_balance < 0:
            raise ValueError("Insufficient points")
        profile.points_balance = new_balance
        tx = PointTransaction(
            customer_id=profile.id,
            transaction_type=PointTransactionType.ADJUSTED,
            points_amount=amount,
            points_balance_after=new_balance,
            source=PointEarnSource.MANUAL,
            description=reason,
        )
        session.add(tx)
        await session.commit()
        await session.refresh(profile)
        return profile


loyalty_service = LoyaltyService()
