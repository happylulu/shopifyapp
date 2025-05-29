"""
Admin Router for Live Database Integration
This replaces the mock admin_api.py with real database operations
"""

from fastapi import APIRouter, HTTPException, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List, Optional
from datetime import datetime, timedelta

# Import database models and dependencies
from models_v2 import (
    Shop, CustomerLoyaltyProfile, RewardDefinition, TierDefinition, 
    RedemptionLog, get_db
)
from shop_context import get_shop_domain, verify_shop_access
from api_models import (
    TierCreate, TierResponse, RewardCreate, RewardResponse,
    LoyaltyProfileResponse
)

# Create router
router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/dashboard/overview")
async def get_dashboard_overview(
    shop_domain: str = Depends(verify_shop_access),
    session: AsyncSession = Depends(get_db)
):
    """Get dashboard overview data from live database"""
    
    # Get shop
    shop_result = await session.execute(
        select(Shop).where(Shop.shop_domain == shop_domain)
    )
    shop = shop_result.scalar_one_or_none()
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")
    
    # Get total members
    total_members_result = await session.execute(
        select(func.count(CustomerLoyaltyProfile.id))
        .where(CustomerLoyaltyProfile.shop_id == shop.id)
    )
    total_members = total_members_result.scalar() or 0
    
    # Get active members (those with activity in last 30 days)
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    active_members_result = await session.execute(
        select(func.count(CustomerLoyaltyProfile.id))
        .where(
            CustomerLoyaltyProfile.shop_id == shop.id,
            CustomerLoyaltyProfile.updated_at >= thirty_days_ago
        )
    )
    active_members = active_members_result.scalar() or 0
    
    # Get total points issued
    points_issued_result = await session.execute(
        select(func.sum(CustomerLoyaltyProfile.points_balance))
        .where(CustomerLoyaltyProfile.shop_id == shop.id)
    )
    points_issued = points_issued_result.scalar() or 0
    
    # Get rewards redeemed count
    rewards_redeemed_result = await session.execute(
        select(func.count(RedemptionLog.id))
        .where(RedemptionLog.shop_id == shop.id)
    )
    rewards_redeemed = rewards_redeemed_result.scalar() or 0
    
    # Get tier distribution
    tier_distribution_result = await session.execute(
        select(
            TierDefinition.name,
            func.count(CustomerLoyaltyProfile.id).label('member_count')
        )
        .join(CustomerLoyaltyProfile, CustomerLoyaltyProfile.current_tier_id == TierDefinition.id, isouter=True)
        .where(TierDefinition.shop_id == shop.id)
        .group_by(TierDefinition.id, TierDefinition.name)
    )
    tier_distribution = []
    for tier_name, member_count in tier_distribution_result:
        percentage = (member_count / total_members * 100) if total_members > 0 else 0
        tier_distribution.append({
            "tier": tier_name,
            "members": member_count or 0,
            "percentage": round(percentage, 1)
        })
    
    # Get recent activity (last 10 redemptions)
    recent_activity_result = await session.execute(
        select(RedemptionLog, CustomerLoyaltyProfile.first_name, CustomerLoyaltyProfile.last_name)
        .join(CustomerLoyaltyProfile)
        .where(RedemptionLog.shop_id == shop.id)
        .order_by(RedemptionLog.redeemed_at.desc())
        .limit(10)
    )
    
    recent_activity = []
    for redemption, first_name, last_name in recent_activity_result:
        customer_name = f"{first_name or ''} {last_name or ''}".strip() or "Unknown Customer"
        recent_activity.append({
            "id": str(redemption.id),
            "type": "reward_redeemed",
            "customer": customer_name,
            "points": -redemption.points_used,
            "reason": f"Redeemed: {redemption.reward_name}",
            "timestamp": redemption.redeemed_at.strftime("%Y-%m-%d %H:%M:%S")
        })
    
    # Calculate conversion rate (members with redemptions / total members)
    conversion_rate = (rewards_redeemed / total_members * 100) if total_members > 0 else 0
    
    return {
        "total_members": total_members,
        "active_members": active_members,
        "points_issued": int(points_issued),
        "rewards_redeemed": rewards_redeemed,
        "conversion_rate": round(conversion_rate, 1),
        "average_order_value": 0.0,  # TODO: Calculate from order data
        "recent_activity": recent_activity,
        "tier_distribution": tier_distribution,
        "top_rewards": []  # TODO: Calculate top rewards
    }


@router.get("/tiers")
async def get_tiers(
    shop_domain: str = Depends(verify_shop_access),
    session: AsyncSession = Depends(get_db)
):
    """Get all tiers for the shop"""
    
    shop_result = await session.execute(
        select(Shop).where(Shop.shop_domain == shop_domain)
    )
    shop = shop_result.scalar_one_or_none()
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")
    
    tiers_result = await session.execute(
        select(TierDefinition)
        .where(TierDefinition.shop_id == shop.id)
        .order_by(TierDefinition.tier_level)
    )
    tiers = tiers_result.scalars().all()
    
    tier_list = []
    for tier in tiers:
        # Get member count for this tier
        member_count_result = await session.execute(
            select(func.count(CustomerLoyaltyProfile.id))
            .where(CustomerLoyaltyProfile.current_tier_id == tier.id)
        )
        member_count = member_count_result.scalar() or 0
        
        tier_list.append({
            "id": str(tier.id),
            "name": tier.name,
            "level": tier.tier_level,
            "min_points_required": tier.min_points_required,
            "description": tier.description or "",
            "benefits": tier.benefits or [],
            "color": "#CD7F32",  # Default color, TODO: add to model
            "is_active": True,  # TODO: add to model
            "member_count": member_count,
            "created_at": tier.created_at.isoformat() if tier.created_at else datetime.utcnow().isoformat()
        })
    
    return {"tiers": tier_list}


@router.post("/tiers")
async def create_tier(
    tier: TierCreate,
    shop_domain: str = Depends(verify_shop_access),
    session: AsyncSession = Depends(get_db)
):
    """Create a new tier"""
    
    shop_result = await session.execute(
        select(Shop).where(Shop.shop_domain == shop_domain)
    )
    shop = shop_result.scalar_one_or_none()
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")
    
    # Create new tier
    new_tier = TierDefinition(
        shop_id=shop.id,
        name=tier.name,
        tier_level=tier.tier_level,
        min_points_required=tier.min_points_required,
        description=tier.description
    )
    
    session.add(new_tier)
    await session.commit()
    await session.refresh(new_tier)
    
    return {
        "tier": {
            "id": str(new_tier.id),
            "name": new_tier.name,
            "level": new_tier.tier_level,
            "min_points_required": new_tier.min_points_required,
            "description": new_tier.description or "",
            "benefits": [],
            "color": "#CD7F32",
            "is_active": True,
            "member_count": 0,
            "created_at": new_tier.created_at.isoformat() if new_tier.created_at else datetime.utcnow().isoformat()
        }
    }


@router.get("/rewards")
async def get_rewards(
    shop_domain: str = Depends(verify_shop_access),
    session: AsyncSession = Depends(get_db)
):
    """Get all rewards for the shop"""
    
    shop_result = await session.execute(
        select(Shop).where(Shop.shop_domain == shop_domain)
    )
    shop = shop_result.scalar_one_or_none()
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")
    
    rewards_result = await session.execute(
        select(RewardDefinition)
        .where(RewardDefinition.shop_id == shop.id)
        .order_by(RewardDefinition.created_at.desc())
    )
    rewards = rewards_result.scalars().all()
    
    reward_list = []
    for reward in rewards:
        # Get redemption count
        redemption_count_result = await session.execute(
            select(func.count(RedemptionLog.id))
            .where(RedemptionLog.reward_id == reward.id)
        )
        redemption_count = redemption_count_result.scalar() or 0
        
        reward_list.append({
            "id": str(reward.id),
            "name": reward.name,
            "description": reward.description or "",
            "points_cost": reward.points_cost,
            "reward_type": reward.reward_type,
            "value": 0.0,  # TODO: add to model
            "category": "general",  # TODO: add to model
            "is_active": True,  # TODO: add to model
            "redemption_count": redemption_count,
            "created_at": reward.created_at.isoformat() if reward.created_at else datetime.utcnow().isoformat()
        })
    
    return {"rewards": reward_list}


@router.post("/rewards")
async def create_reward(
    reward: RewardCreate,
    shop_domain: str = Depends(verify_shop_access),
    session: AsyncSession = Depends(get_db)
):
    """Create a new reward"""
    
    shop_result = await session.execute(
        select(Shop).where(Shop.shop_domain == shop_domain)
    )
    shop = shop_result.scalar_one_or_none()
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")
    
    # Create new reward
    new_reward = RewardDefinition(
        shop_id=shop.id,
        name=reward.name,
        description=reward.description,
        reward_type=reward.reward_type,
        points_cost=reward.points_cost
    )
    
    session.add(new_reward)
    await session.commit()
    await session.refresh(new_reward)
    
    return {
        "reward": {
            "id": str(new_reward.id),
            "name": new_reward.name,
            "description": new_reward.description or "",
            "points_cost": new_reward.points_cost,
            "reward_type": new_reward.reward_type,
            "value": 0.0,
            "category": "general",
            "is_active": True,
            "redemption_count": 0,
            "created_at": new_reward.created_at.isoformat() if new_reward.created_at else datetime.utcnow().isoformat()
        }
    }


@router.get("/analytics/summary")
async def get_analytics_summary(
    shop_domain: str = Depends(verify_shop_access),
    session: AsyncSession = Depends(get_db)
):
    """Get analytics summary from live database"""
    
    shop_result = await session.execute(
        select(Shop).where(Shop.shop_domain == shop_domain)
    )
    shop = shop_result.scalar_one_or_none()
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")
    
    # Calculate metrics for last 30 days
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    
    # New members in last 30 days
    new_members_result = await session.execute(
        select(func.count(CustomerLoyaltyProfile.id))
        .where(
            CustomerLoyaltyProfile.shop_id == shop.id,
            CustomerLoyaltyProfile.created_at >= thirty_days_ago
        )
    )
    new_members = new_members_result.scalar() or 0
    
    # Points redeemed in last 30 days
    points_redeemed_result = await session.execute(
        select(func.sum(RedemptionLog.points_used))
        .where(
            RedemptionLog.shop_id == shop.id,
            RedemptionLog.redeemed_at >= thirty_days_ago
        )
    )
    points_redeemed = points_redeemed_result.scalar() or 0
    
    # Rewards redeemed in last 30 days
    rewards_redeemed_result = await session.execute(
        select(func.count(RedemptionLog.id))
        .where(
            RedemptionLog.shop_id == shop.id,
            RedemptionLog.redeemed_at >= thirty_days_ago
        )
    )
    rewards_redeemed = rewards_redeemed_result.scalar() or 0
    
    return {
        "period": "last_30_days",
        "metrics": {
            "new_members": new_members,
            "points_earned": 0,  # TODO: Calculate from transaction logs
            "points_redeemed": int(points_redeemed),
            "rewards_redeemed": rewards_redeemed,
            "tier_upgrades": 0,  # TODO: Calculate from tier change logs
            "engagement_rate": 0.0,  # TODO: Calculate engagement
        },
        "trends": {
            "member_growth": 0.0,  # TODO: Calculate growth trends
            "points_velocity": 0.0,
            "redemption_rate": 0.0,
        },
    }
