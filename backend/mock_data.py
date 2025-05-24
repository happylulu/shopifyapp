from datetime import datetime, timezone

# Mock customers
CUSTOMERS = [
    {
        "id": 1,
        "name": "Alice",
        "points_balance": 1200,
        "last_activity_at": datetime(2025, 5, 20, 10, 0, 0, tzinfo=timezone.utc),
    },
    {
        "id": 2,
        "name": "Bob",
        "points_balance": 300,
        "last_activity_at": datetime(2025, 4, 15, 10, 0, 0, tzinfo=timezone.utc),
    },
]

# Mock point transactions
POINT_TRANSACTIONS = [
    {
        "customer_id": 1,
        "points_change": 100,
        "type": "purchase_award",
        "created_at": datetime(2025, 5, 1, 10, 0, 0, tzinfo=timezone.utc),
    },
    {
        "customer_id": 2,
        "points_change": 50,
        "type": "purchase_award",
        "created_at": datetime(2025, 4, 5, 10, 0, 0, tzinfo=timezone.utc),
    },
    {
        "customer_id": 1,
        "points_change": -500,
        "type": "redemption",
        "created_at": datetime(2025, 5, 10, 10, 0, 0, tzinfo=timezone.utc),
    },
]

# Mock reward redemptions
REWARD_REDEMPTIONS = [
    {
        "customer_id": 1,
        "reward_name": "$5 Off",
        "points_cost": 500,
        "discount_code": "LOYALTYXYZ123",
        "redeemed_at": datetime(2025, 5, 10, 10, 0, 0, tzinfo=timezone.utc),
    }
]

# Mock orders
ORDERS = [
    {
        "id": "order1",
        "customer_id": 1,
        "total_amount": 75.00,
        "discount_codes_used": ["LOYALTYXYZ123"],
        "created_at": datetime(2025, 5, 10, 11, 0, 0, tzinfo=timezone.utc),
    },
    {
        "id": "order2",
        "customer_id": 2,
        "total_amount": 30.00,
        "discount_codes_used": [],
        "created_at": datetime(2025, 4, 5, 11, 0, 0, tzinfo=timezone.utc),
    },
]

def get_dashboard_data():
    """Get mock dashboard overview data"""
    return {
        "total_points_issued": {
            "value": 2500,
            "percent_change": 15.2,
        },
        "active_members": {
            "value": 324,
            "percent_change": 8.7,
        },
        "points_redeemed": {
            "value": 1800,
            "percent_change": -3.1,
        },
        "revenue_impact": {
            "value": 12750.50,
            "percent_change": 22.4,
        },
    }

def get_points_program_data():
    """Get mock points program settings data"""
    return {
        "points_per_dollar": 10,
        "point_value": 0.01,
        "earning_options": {
            "purchase": {"enabled": True, "points": 10},
            "signup": {"enabled": True, "points": 100},
            "birthday": {"enabled": True, "points": 250},
            "social_share": {"enabled": True, "points": 50},
        },
        "redemption_options": [
            {"name": "$10 off", "points_required": 1000},
            {"name": "15% off", "points_required": 1500},
            {"name": "Free shipping", "points_required": 500},
            {"name": "Free product", "points_required": 2000},
        ],
        "program_rules": {
            "points_expiration": {"enabled": True, "months": 12},
            "minimum_redemption": {"enabled": True, "points": 100},
        }
    }
