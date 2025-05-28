#!/usr/bin/env python3
"""
Test GraphQL Setup
Quick test to verify our GraphQL API is working
"""

import requests
import json

def test_graphql_endpoint():
    """Test the GraphQL endpoint"""
    url = "http://localhost:8005/graphql"
    
    # Test loyalty profile query
    query = """
    query GetLoyaltyProfile($customerId: String!) {
        loyaltyProfile(customerId: $customerId) {
            id
            customer_id
            points_balance
            current_tier {
                name
                level
            }
        }
    }
    """
    
    variables = {"customerId": "test-customer-123"}
    
    try:
        response = requests.post(
            url,
            json={"query": query, "variables": variables},
            headers={"Content-Type": "application/json"},
            timeout=5
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 200:
            data = response.json()
            if "data" in data and data["data"]["loyaltyProfile"]:
                print("✅ GraphQL loyalty profile query successful!")
                return True
            else:
                print("❌ GraphQL query returned no data")
                return False
        else:
            print("❌ GraphQL endpoint returned error")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Failed to connect to GraphQL endpoint: {e}")
        return False

def test_rewards_query():
    """Test the rewards query"""
    url = "http://localhost:8005/graphql"
    
    query = """
    query GetRewards {
        availableRewards {
            id
            name
            points_cost
            available
        }
    }
    """
    
    try:
        response = requests.post(
            url,
            json={"query": query},
            headers={"Content-Type": "application/json"},
            timeout=5
        )
        
        if response.status_code == 200:
            data = response.json()
            if "data" in data and data["data"]["availableRewards"]:
                rewards = data["data"]["availableRewards"]
                print(f"✅ Found {len(rewards)} available rewards")
                return True
            else:
                print("❌ No rewards found")
                return False
        else:
            print("❌ Rewards query failed")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Failed to query rewards: {e}")
        return False

def test_health_endpoint():
    """Test the health endpoint"""
    url = "http://localhost:8005/health"
    
    try:
        response = requests.get(url, timeout=5)
        
        if response.status_code == 200:
            print("✅ Health endpoint is working")
            print(f"Response: {response.json()}")
            return True
        else:
            print("❌ Health endpoint failed")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Failed to connect to health endpoint: {e}")
        return False

if __name__ == "__main__":
    print("🧪 Testing GraphQL Setup...")
    print("=" * 50)
    
    # Test health endpoint
    print("\n1. Testing health endpoint...")
    health_ok = test_health_endpoint()
    
    # Test GraphQL loyalty profile
    print("\n2. Testing loyalty profile query...")
    profile_ok = test_graphql_endpoint()
    
    # Test rewards query
    print("\n3. Testing rewards query...")
    rewards_ok = test_rewards_query()
    
    print("\n" + "=" * 50)
    print("📊 Test Results:")
    print(f"Health Endpoint: {'✅ PASS' if health_ok else '❌ FAIL'}")
    print(f"Loyalty Profile: {'✅ PASS' if profile_ok else '❌ FAIL'}")
    print(f"Rewards Query: {'✅ PASS' if rewards_ok else '❌ FAIL'}")
    
    if all([health_ok, profile_ok, rewards_ok]):
        print("\n🎉 All tests passed! GraphQL setup is working correctly.")
        print("\nNext steps:")
        print("1. Visit http://localhost:3000/test-graphql to test the frontend")
        print("2. Check React Query DevTools in the browser")
        print("3. Test the type-safe hooks with real data")
    else:
        print("\n❌ Some tests failed. Please check the GraphQL server.")
        print("Make sure the server is running: python simple_graphql_api.py")
