"""
Simplified GraphQL API for Testing
Basic GraphQL implementation for our loyalty system
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import json
from typing import Dict, Any, List, Optional

app = FastAPI(title="Loyalty GraphQL API", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mock data for testing
MOCK_LOYALTY_PROFILES = {
    "test-customer-123": {
        "id": "profile-123",
        "customer_id": "test-customer-123",
        "points_balance": 1500,
        "lifetime_points": 3000,
        "current_tier": {
            "id": "tier-gold",
            "name": "Gold",
            "level": 2,
            "min_points_required": 1000,
            "description": "Gold tier with exclusive benefits",
            "benefits": ["Free shipping", "Priority support", "Exclusive discounts"],
            "icon_url": None,
            "color": "#FFD700"
        },
        "next_tier": {
            "id": "tier-platinum",
            "name": "Platinum",
            "level": 3,
            "min_points_required": 2500,
            "description": "Platinum tier with premium benefits"
        },
        "points_to_next_tier": 1000,
        "tier_progress_percentage": 50.0,
        "member_since": "2024-01-15T10:00:00Z",
        "last_activity": "2024-01-20T15:30:00Z"
    }
}

MOCK_REWARDS = [
    {
        "id": "reward-1",
        "name": "10% Discount",
        "description": "Get 10% off your next order",
        "points_cost": 500,
        "reward_type": "discount",
        "value": "10.00",
        "image_url": None,
        "category": "discount",
        "available": True,
        "terms_and_conditions": "Valid for 30 days",
        "expires_at": None
    },
    {
        "id": "reward-2",
        "name": "Free Shipping",
        "description": "Free shipping on your next order",
        "points_cost": 200,
        "reward_type": "shipping",
        "value": "0.00",
        "image_url": None,
        "category": "shipping",
        "available": True,
        "terms_and_conditions": "Valid for orders over $25",
        "expires_at": None
    },
    {
        "id": "reward-3",
        "name": "$5 Store Credit",
        "description": "Get $5 store credit",
        "points_cost": 1000,
        "reward_type": "credit",
        "value": "5.00",
        "image_url": None,
        "category": "credit",
        "available": True,
        "terms_and_conditions": "No expiration",
        "expires_at": None
    }
]

MOCK_POINTS_HISTORY = [
    {
        "id": "tx-1",
        "amount": 100,
        "transaction_type": "earned",
        "reason": "Order purchase",
        "reference_id": "order-123",
        "created_at": "2024-01-20T15:30:00Z",
        "expires_at": None
    },
    {
        "id": "tx-2",
        "amount": -50,
        "transaction_type": "redeemed",
        "reason": "Discount redemption",
        "reference_id": "redemption-456",
        "created_at": "2024-01-19T10:15:00Z",
        "expires_at": None
    },
    {
        "id": "tx-3",
        "amount": 200,
        "transaction_type": "earned",
        "reason": "Referral bonus",
        "reference_id": "referral-789",
        "created_at": "2024-01-18T14:20:00Z",
        "expires_at": None
    }
]

def resolve_loyalty_profile(customer_id: str) -> Optional[Dict[str, Any]]:
    """Resolve loyalty profile for a customer"""
    return MOCK_LOYALTY_PROFILES.get(customer_id)

def resolve_available_rewards(customer_id: Optional[str] = None, max_points: Optional[int] = None, category: Optional[str] = None) -> List[Dict[str, Any]]:
    """Resolve available rewards"""
    rewards = MOCK_REWARDS.copy()
    
    if max_points:
        rewards = [r for r in rewards if r["points_cost"] <= max_points]
    
    if category:
        rewards = [r for r in rewards if r["category"] == category]
    
    return rewards

def resolve_points_history(customer_id: str, limit: int = 20, offset: int = 0) -> List[Dict[str, Any]]:
    """Resolve points history for a customer"""
    # In a real implementation, this would filter by customer_id
    history = MOCK_POINTS_HISTORY.copy()
    return history[offset:offset + limit]

def execute_graphql_query(query: str, variables: Dict[str, Any] = None) -> Dict[str, Any]:
    """Simple GraphQL query executor"""
    variables = variables or {}
    
    # Parse query type
    if "loyaltyProfile" in query:
        customer_id = variables.get("customerId")
        if not customer_id:
            return {"errors": [{"message": "customerId is required"}]}
        
        profile = resolve_loyalty_profile(customer_id)
        return {"data": {"loyaltyProfile": profile}}
    
    elif "availableRewards" in query:
        customer_id = variables.get("customerId")
        max_points = variables.get("maxPoints")
        category = variables.get("category")
        
        rewards = resolve_available_rewards(customer_id, max_points, category)
        return {"data": {"availableRewards": rewards}}
    
    elif "pointsHistory" in query:
        customer_id = variables.get("customerId")
        limit = variables.get("limit", 20)
        offset = variables.get("offset", 0)
        
        if not customer_id:
            return {"errors": [{"message": "customerId is required"}]}
        
        history = resolve_points_history(customer_id, limit, offset)
        return {"data": {"pointsHistory": history}}
    
    elif "redeemReward" in query:
        input_data = variables.get("input", {})
        customer_id = input_data.get("customer_id")
        reward_id = input_data.get("reward_id")
        
        if not customer_id or not reward_id:
            return {"errors": [{"message": "customer_id and reward_id are required"}]}
        
        # Find the reward
        reward = next((r for r in MOCK_REWARDS if r["id"] == reward_id), None)
        if not reward:
            return {"errors": [{"message": "Reward not found"}]}
        
        # Check if customer has enough points
        profile = resolve_loyalty_profile(customer_id)
        if not profile:
            return {"errors": [{"message": "Customer profile not found"}]}
        
        if profile["points_balance"] < reward["points_cost"]:
            return {
                "data": {
                    "redeemReward": {
                        "success": False,
                        "message": f"Insufficient points. Need {reward['points_cost']}, have {profile['points_balance']}",
                        "redemption_id": None,
                        "discount_code": None,
                        "points_deducted": None,
                        "new_balance": None
                    }
                }
            }
        
        # Simulate successful redemption
        new_balance = profile["points_balance"] - reward["points_cost"]
        discount_code = f"LOYALTY{reward_id.upper()}" if reward["reward_type"] == "discount" else None
        
        return {
            "data": {
                "redeemReward": {
                    "success": True,
                    "message": f"Successfully redeemed {reward['name']}",
                    "redemption_id": f"redemption-{reward_id}-{customer_id}",
                    "discount_code": discount_code,
                    "points_deducted": reward["points_cost"],
                    "new_balance": new_balance
                }
            }
        }
    
    elif "trackAction" in query:
        # Simple action tracking
        return {"data": {"trackAction": True}}
    
    else:
        return {"errors": [{"message": "Unknown query"}]}

@app.post("/graphql")
async def graphql_endpoint(request: Request):
    """GraphQL endpoint"""
    try:
        body = await request.json()
        query = body.get("query", "")
        variables = body.get("variables", {})
        
        result = execute_graphql_query(query, variables)
        return result
        
    except Exception as e:
        return {"errors": [{"message": f"GraphQL execution error: {str(e)}"}]}

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Loyalty GraphQL API",
        "version": "1.0.0",
        "endpoints": {
            "graphql": "/graphql"
        }
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "loyalty-graphql-api"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8005)
