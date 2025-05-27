#!/usr/bin/env python3
"""
Test script for loyalty API endpoints
"""
import asyncio
import json
from fastapi.testclient import TestClient
from main import app

def test_loyalty_endpoints():
    """Test the loyalty API endpoints"""
    print("🧪 Testing Loyalty API Endpoints")
    print("=" * 50)
    
    # Create test client
    client = TestClient(app)
    
    # Test 1: Health check
    print("\n1️⃣ Testing health endpoint...")
    response = client.get("/health")
    print(f"   Status: {response.status_code}")
    print(f"   Response: {response.json()}")
    
    # Test 2: Create loyalty profile
    print("\n2️⃣ Testing create loyalty profile...")
    profile_data = {
        "shopify_customer_id": "customer123",
        "email": "test@example.com",
        "first_name": "John",
        "last_name": "Doe"
    }
    response = client.post("/loyalty/profiles/", json=profile_data)
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        profile = response.json()
        print(f"   Created profile: {profile['shopify_customer_id']} with {profile['points_balance']} points")
    else:
        print(f"   Error: {response.text}")
    
    # Test 3: Get loyalty profile
    print("\n3️⃣ Testing get loyalty profile...")
    response = client.get("/loyalty/profiles/customer123/")
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        profile = response.json()
        print(f"   Profile: {profile['shopify_customer_id']} - {profile['points_balance']} points")
    else:
        print(f"   Error: {response.text}")
    
    # Test 4: Adjust points
    print("\n4️⃣ Testing adjust points...")
    points_data = {
        "amount": 100,
        "reason": "Welcome bonus"
    }
    response = client.put("/loyalty/profiles/customer123/points/", json=points_data)
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        profile = response.json()
        print(f"   ✅ Points adjusted! New balance: {profile['points_balance']} points")
    else:
        print(f"   Error: {response.text}")
    
    # Test 5: Create a reward
    print("\n5️⃣ Testing create reward...")
    reward_data = {
        "name": "10% Discount",
        "points_cost": 50,
        "reward_type": "discount",
        "description": "Get 10% off your next purchase"
    }
    response = client.post("/rewards/", json=reward_data)
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        reward = response.json()
        print(f"   ✅ Created reward: {reward['name']} for {reward['points_cost']} points")
    else:
        print(f"   Error: {response.text}")
    
    # Test 6: List rewards
    print("\n6️⃣ Testing list rewards...")
    response = client.get("/rewards/")
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        rewards = response.json()
        print(f"   ✅ Found {len(rewards)} rewards")
        for reward in rewards:
            print(f"      - {reward['name']}: {reward['points_cost']} points")
    else:
        print(f"   Error: {response.text}")
    
    # Test 7: Create a tier
    print("\n7️⃣ Testing create tier...")
    tier_data = {
        "name": "Bronze",
        "tier_level": 1,
        "min_points_required": 0,
        "description": "Entry level tier"
    }
    response = client.post("/tiers/", json=tier_data)
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        tier = response.json()
        print(f"   ✅ Created tier: {tier['name']} (Level {tier['tier_level']})")
    else:
        print(f"   Error: {response.text}")
    
    # Test 8: List tiers
    print("\n8️⃣ Testing list tiers...")
    response = client.get("/tiers/")
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        tiers = response.json()
        print(f"   ✅ Found {len(tiers)} tiers")
        for tier in tiers:
            print(f"      - {tier['name']}: Level {tier['tier_level']} ({tier['min_points_required']} points required)")
    else:
        print(f"   Error: {response.text}")
    
    print("\n🎉 Loyalty API testing complete!")

if __name__ == "__main__":
    test_loyalty_endpoints()
