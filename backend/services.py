from datetime import datetime
from typing import List

from .mock_data import POINT_TRANSACTIONS, REWARD_REDEMPTIONS, ORDERS


def get_total_points_issued(start: datetime, end: datetime) -> int:
    """Return total points issued (excluding redemptions) in given period."""
    total = 0
    for tx in POINT_TRANSACTIONS:
        if start <= tx["created_at"] <= end and tx["points_change"] > 0:
            total += tx["points_change"]
    return total


def get_active_members(start: datetime, end: datetime) -> int:
    """Return number of unique customers with transactions in period."""
    customer_ids: set[int] = set()
    for tx in POINT_TRANSACTIONS:
        if start <= tx["created_at"] <= end:
            customer_ids.add(tx["customer_id"])
    return len(customer_ids)


def get_points_redeemed(start: datetime, end: datetime) -> int:
    """Return points redeemed in period."""
    total = 0
    for tx in POINT_TRANSACTIONS:
        if start <= tx["created_at"] <= end and tx["points_change"] < 0:
            total += -tx["points_change"]
    return total


def get_revenue_impact(start: datetime, end: datetime) -> float:
    """Return total order value using loyalty discount codes in period."""
    # get discount codes issued via reward redemptions
    codes = {r["discount_code"] for r in REWARD_REDEMPTIONS}
    revenue = 0.0
    for order in ORDERS:
        if start <= order["created_at"] <= end:
            if any(code in codes for code in order["discount_codes_used"]):
                revenue += float(order["total_amount"])
    return revenue
