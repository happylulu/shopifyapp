"""
Admin API for Loyalty System
FastAPI endpoints for merchant admin interface
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Pydantic models for admin API
class TierCreate(BaseModel):
    name: str
    min_points_required: int
    description: str
    benefits: List[str]
    color: str
    is_active: bool = True

class TierUpdate(BaseModel):
    name: Optional[str] = None
    min_points_required: Optional[int] = None
    description: Optional[str] = None
    benefits: Optional[List[str]] = None
    color: Optional[str] = None
    is_active: Optional[bool] = None

class RewardCreate(BaseModel):
    name: str
    description: str
    points_cost: int
    reward_type: str
    value: float
    category: str
    is_active: bool = True
    min_order_value: Optional[float] = None
    max_uses: Optional[int] = None
    expiry_days: Optional[int] = None
    terms_and_conditions: Optional[str] = None

class RewardUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    points_cost: Optional[int] = None
    reward_type: Optional[str] = None
    value: Optional[float] = None
    category: Optional[str] = None
    is_active: Optional[bool] = None
    min_order_value: Optional[float] = None
    max_uses: Optional[int] = None
    expiry_days: Optional[int] = None
    terms_and_conditions: Optional[str] = None

# Mock data stores (replace with actual database)
mock_tiers = [
    {
        "id": "1",
        "name": "Bronze",
        "level": 1,
        "min_points_required": 0,
        "description": "Welcome tier for new members",
        "benefits": ["1x points on purchases", "Birthday discount"],
        "color": "#CD7F32",
        "is_active": True,
        "member_count": 623,
        "created_at": datetime.now().isoformat(),
    },
    {
        "id": "2",
        "name": "Silver",
        "level": 2,
        "min_points_required": 500,
        "description": "Tier for regular customers",
        "benefits": ["1.2x points on purchases", "Free shipping", "Early access to sales"],
        "color": "#C0C0C0",
        "is_active": True,
        "member_count": 374,
        "created_at": datetime.now().isoformat(),
    },
]

mock_rewards = [
    {
        "id": "1",
        "name": "10% Off Next Order",
        "description": "Get 10% discount on your next purchase",
        "points_cost": 500,
        "reward_type": "discount_percentage",
        "value": 10.0,
        "category": "discount",
        "is_active": True,
        "redemption_count": 45,
        "min_order_value": 50.0,
        "expiry_days": 30,
        "created_at": datetime.now().isoformat(),
    },
    {
        "id": "2",
        "name": "Free Shipping",
        "description": "Free shipping on any order",
        "points_cost": 200,
        "reward_type": "free_shipping",
        "value": 0.0,
        "category": "shipping",
        "is_active": True,
        "redemption_count": 38,
        "expiry_days": 60,
        "created_at": datetime.now().isoformat(),
    },
]

# FastAPI app
app = FastAPI(title="Loyalty Admin API", version="1.0.0")

# Add CORS middleware to allow frontend connections
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://localhost:3002"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dashboard endpoints
@app.get("/admin/dashboard/overview")
async def get_dashboard_overview():
    """Get dashboard overview data"""
    return {
        "total_members": 1247,
        "active_members": 892,
        "points_issued": 45230,
        "rewards_redeemed": 156,
        "conversion_rate": 12.5,
        "average_order_value": 87.50,
        "recent_activity": [
            {
                "id": "1",
                "type": "points_earned",
                "customer": "John Doe",
                "points": 150,
                "reason": "Order #1001",
                "timestamp": "2 hours ago",
            },
            {
                "id": "2",
                "type": "reward_redeemed",
                "customer": "Jane Smith",
                "points": -500,
                "reason": "10% Discount",
                "timestamp": "4 hours ago",
            },
        ],
        "tier_distribution": [
            {"tier": "Bronze", "members": 623, "percentage": 50},
            {"tier": "Silver", "members": 374, "percentage": 30},
            {"tier": "Gold", "members": 187, "percentage": 15},
            {"tier": "Platinum", "members": 63, "percentage": 5},
        ],
        "top_rewards": [
            {"name": "10% Discount", "redemptions": 45, "points_cost": 500},
            {"name": "Free Shipping", "redemptions": 38, "points_cost": 200},
            {"name": "$5 Store Credit", "redemptions": 23, "points_cost": 1000},
        ],
    }

# Tier management endpoints
@app.get("/admin/tiers")
async def get_tiers():
    """Get all tiers"""
    return {"tiers": mock_tiers}

@app.post("/admin/tiers")
async def create_tier(tier: TierCreate):
    """Create a new tier"""
    new_tier = {
        "id": str(len(mock_tiers) + 1),
        "level": len(mock_tiers) + 1,
        "member_count": 0,
        "created_at": datetime.now().isoformat(),
        **tier.dict(),
    }
    mock_tiers.append(new_tier)
    logger.info(f"Created tier: {tier.name}")
    return {"tier": new_tier}

@app.get("/admin/tiers/{tier_id}")
async def get_tier(tier_id: str):
    """Get a specific tier"""
    tier = next((t for t in mock_tiers if t["id"] == tier_id), None)
    if not tier:
        raise HTTPException(status_code=404, detail="Tier not found")
    return {"tier": tier}

@app.put("/admin/tiers/{tier_id}")
async def update_tier(tier_id: str, tier_update: TierUpdate):
    """Update a tier"""
    tier = next((t for t in mock_tiers if t["id"] == tier_id), None)
    if not tier:
        raise HTTPException(status_code=404, detail="Tier not found")

    # Update tier with provided fields
    update_data = tier_update.dict(exclude_unset=True)
    tier.update(update_data)
    tier["updated_at"] = datetime.now().isoformat()

    logger.info(f"Updated tier: {tier_id}")
    return {"tier": tier}

@app.delete("/admin/tiers/{tier_id}")
async def delete_tier(tier_id: str):
    """Delete a tier"""
    global mock_tiers
    tier = next((t for t in mock_tiers if t["id"] == tier_id), None)
    if not tier:
        raise HTTPException(status_code=404, detail="Tier not found")

    if tier["member_count"] > 0:
        raise HTTPException(status_code=400, detail="Cannot delete tier with existing members")

    mock_tiers = [t for t in mock_tiers if t["id"] != tier_id]
    logger.info(f"Deleted tier: {tier_id}")
    return {"message": "Tier deleted successfully"}

# Reward management endpoints
@app.get("/admin/rewards")
async def get_rewards():
    """Get all rewards"""
    return {"rewards": mock_rewards}

@app.post("/admin/rewards")
async def create_reward(reward: RewardCreate):
    """Create a new reward"""
    new_reward = {
        "id": str(len(mock_rewards) + 1),
        "redemption_count": 0,
        "created_at": datetime.now().isoformat(),
        **reward.dict(),
    }
    mock_rewards.append(new_reward)
    logger.info(f"Created reward: {reward.name}")
    return {"reward": new_reward}

@app.get("/admin/rewards/{reward_id}")
async def get_reward(reward_id: str):
    """Get a specific reward"""
    reward = next((r for r in mock_rewards if r["id"] == reward_id), None)
    if not reward:
        raise HTTPException(status_code=404, detail="Reward not found")
    return {"reward": reward}

@app.put("/admin/rewards/{reward_id}")
async def update_reward(reward_id: str, reward_update: RewardUpdate):
    """Update a reward"""
    reward = next((r for r in mock_rewards if r["id"] == reward_id), None)
    if not reward:
        raise HTTPException(status_code=404, detail="Reward not found")

    # Update reward with provided fields
    update_data = reward_update.dict(exclude_unset=True)
    reward.update(update_data)
    reward["updated_at"] = datetime.now().isoformat()

    logger.info(f"Updated reward: {reward_id}")
    return {"reward": reward}

@app.delete("/admin/rewards/{reward_id}")
async def delete_reward(reward_id: str):
    """Delete a reward"""
    global mock_rewards
    reward = next((r for r in mock_rewards if r["id"] == reward_id), None)
    if not reward:
        raise HTTPException(status_code=404, detail="Reward not found")

    mock_rewards = [r for r in mock_rewards if r["id"] != reward_id]
    logger.info(f"Deleted reward: {reward_id}")
    return {"message": "Reward deleted successfully"}

# Analytics endpoints
@app.get("/admin/analytics/summary")
async def get_analytics_summary():
    """Get analytics summary"""
    return {
        "period": "last_30_days",
        "metrics": {
            "new_members": 156,
            "points_earned": 12450,
            "points_redeemed": 8230,
            "rewards_redeemed": 45,
            "tier_upgrades": 23,
            "engagement_rate": 68.5,
        },
        "trends": {
            "member_growth": 12.3,
            "points_velocity": 8.7,
            "redemption_rate": 15.2,
        },
    }

# Health check
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "loyalty-admin-api",
        "timestamp": datetime.now().isoformat(),
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
