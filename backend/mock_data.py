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
