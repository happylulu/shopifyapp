import os
import importlib
from fastapi.testclient import TestClient

os.environ['DATABASE_URL'] = 'sqlite+aiosqlite:///:memory:'

import backend.main as main

client = TestClient(main.app)


def test_create_and_get_profile():
    res = client.post("/loyalty/profiles/", json={"shopify_customer_id": "cust1"})
    assert res.status_code == 200
    data = res.json()
    assert data["shopify_customer_id"] == "cust1"

    res = client.get("/loyalty/profiles/cust1/")
    assert res.status_code == 200
    assert res.json()["shopify_customer_id"] == "cust1"


def test_adjust_points():
    client.post("/loyalty/profiles/", json={"shopify_customer_id": "cust2"})
    res = client.put("/loyalty/profiles/cust2/points/", json={"amount": 50})
    assert res.status_code == 200
    assert res.json()["points_balance"] == 50


def test_rewards_and_tiers():
    r = client.post("/rewards/", json={"name": "Test Reward", "points_cost": 10, "reward_type": "custom"})
    assert r.status_code == 200

    t = client.post("/tiers/", json={"name": "Bronze", "tier_level": 1, "min_points_required": 0})
    assert t.status_code == 200

    rewards = client.get("/rewards/")
    assert rewards.status_code == 200
    assert len(rewards.json()) >= 1

    tiers = client.get("/tiers/")
    assert tiers.status_code == 200
    assert len(tiers.json()) >= 1
