"""
Comprehensive Tests for GraphQL API
Tests authentication, queries, mutations, and performance
"""

import pytest
import asyncio
import json
from datetime import datetime, timedelta
from unittest.mock import Mock, patch, AsyncMock
from fastapi.testclient import TestClient
from httpx import AsyncClient

from graphql_api import schema, get_context
from graphql_main import app
from models_v2 import CustomerLoyaltyProfile, RewardDefinition, TierDefinition


class TestGraphQLAuthentication:
    """Test GraphQL authentication and authorization"""
    
    @pytest.fixture
    def client(self):
        """Create test client"""
        return TestClient(app)

    def test_storefront_access_with_shop_domain(self, client):
        """Test storefront access with shop domain header"""
        query = """
        query {
          availableRewards {
            id
            name
            points_cost
          }
        }
        """
        
        response = client.post(
            "/graphql",
            json={"query": query},
            headers={
                "X-Shopify-Shop-Domain": "test.myshopify.com",
                "Content-Type": "application/json"
            }
        )
        
        # Should not fail due to missing auth for public queries
        assert response.status_code == 200

    def test_admin_access_with_session_token(self, client):
        """Test admin access with session token"""
        query = """
        query {
          loyaltyAnalytics {
            total_customers
            redemption_rate
          }
        }
        """
        
        with patch('graphql_api.verify_session_token') as mock_verify:
            mock_verify.return_value = {
                "sub": "admin-user",
                "shop": "test.myshopify.com",
                "aud": "admin"
            }
            
            response = client.post(
                "/graphql",
                json={"query": query},
                headers={
                    "Authorization": "Bearer valid-session-token",
                    "X-Shopify-Shop-Domain": "test.myshopify.com",
                    "Content-Type": "application/json"
                }
            )
            
            assert response.status_code == 200

    def test_app_proxy_signature_verification(self, client):
        """Test Shopify App Proxy signature verification"""
        query = """
        query GetLoyaltyProfile($customerId: String!) {
          loyaltyProfile(customerId: $customerId) {
            points_balance
          }
        }
        """
        
        with patch('graphql_api.verify_app_proxy_signature') as mock_verify:
            mock_verify.return_value = True
            
            response = client.post(
                "/graphql",
                json={
                    "query": query,
                    "variables": {"customerId": "test-customer"}
                },
                headers={
                    "X-Shopify-Shop-Domain": "test.myshopify.com",
                    "X-Shopify-Signature": "valid-signature",
                    "Content-Type": "application/json"
                }
            )
            
            assert response.status_code == 200

    def test_invalid_authentication(self, client):
        """Test invalid authentication handling"""
        query = """
        query {
          loyaltyAnalytics {
            total_customers
          }
        }
        """
        
        response = client.post(
            "/graphql",
            json={"query": query},
            headers={
                "Authorization": "Bearer invalid-token",
                "Content-Type": "application/json"
            }
        )
        
        # Should return error for protected admin query
        assert response.status_code == 200
        data = response.json()
        assert "errors" in data


class TestGraphQLQueries:
    """Test GraphQL query functionality"""
    
    @pytest.mark.asyncio
    async def test_loyalty_profile_query(self):
        """Test loyalty profile query with DataLoader"""
        query = """
        query GetLoyaltyProfile($customerId: String!) {
          loyaltyProfile(customerId: $customerId) {
            id
            points_balance
            current_tier {
              name
              level
            }
            tier_progress_percentage
          }
        }
        """
        
        variables = {"customerId": "test-customer-123"}
        
        # Mock database and context
        with patch('graphql_api.get_db') as mock_db, \
             patch('graphql_api.loyalty_service') as mock_loyalty_service:
            
            mock_session = AsyncMock()
            mock_db.return_value.__aenter__.return_value = mock_session
            
            # Mock shop lookup
            mock_session.execute.return_value.scalar_one_or_none.return_value = "shop-id-123"
            
            # Mock loyalty profile
            mock_profile = Mock()
            mock_profile.id = "profile-123"
            mock_profile.shopify_customer_id = "test-customer-123"
            mock_profile.points_balance = 1500
            mock_profile.lifetime_points_earned = 3000
            mock_profile.current_tier_name = "Gold"
            mock_profile.created_at = datetime.utcnow()
            mock_profile.updated_at = datetime.utcnow()
            
            mock_loyalty_service.get_profile.return_value = mock_profile
            
            # Mock tier lookup
            mock_tier = Mock()
            mock_tier.id = "tier-gold"
            mock_tier.name = "Gold"
            mock_tier.tier_level = 2
            mock_tier.min_points_required = 1000
            mock_tier.description = "Gold tier benefits"
            
            mock_session.execute.return_value.scalar_one_or_none.side_effect = [
                "shop-id-123",  # Shop lookup
                mock_tier       # Tier lookup
            ]
            
            # Mock context
            context = {
                "db": mock_session,
                "shop_domain": "test.myshopify.com",
                "shop_id": "shop-id-123",
                "api_token": "test-token"
            }
            
            # Execute query
            result = await schema.execute(
                query,
                variable_values=variables,
                context_value=context
            )
            
            # Verify results
            assert result.errors is None
            assert result.data is not None
            assert result.data["loyaltyProfile"]["points_balance"] == 1500

    @pytest.mark.asyncio
    async def test_available_rewards_query(self):
        """Test available rewards query with filtering"""
        query = """
        query GetRewards($maxPoints: Int, $category: String) {
          availableRewards(maxPoints: $maxPoints, category: $category) {
            id
            name
            points_cost
            reward_type
            available
          }
        }
        """
        
        variables = {"maxPoints": 1000, "category": "discount"}
        
        with patch('graphql_api.get_db') as mock_db:
            mock_session = AsyncMock()
            mock_db.return_value.__aenter__.return_value = mock_session
            
            # Mock shop lookup
            mock_session.execute.return_value.scalar_one_or_none.return_value = "shop-id-123"
            
            # Mock rewards
            mock_rewards = [
                Mock(
                    id="reward-1",
                    name="10% Discount",
                    points_cost=500,
                    reward_type="discount",
                    description="10% off next order"
                ),
                Mock(
                    id="reward-2",
                    name="Free Shipping",
                    points_cost=200,
                    reward_type="shipping",
                    description="Free shipping on next order"
                )
            ]
            
            mock_session.execute.return_value.scalars.return_value.all.return_value = mock_rewards
            
            context = {
                "db": mock_session,
                "shop_domain": "test.myshopify.com",
                "shop_id": "shop-id-123"
            }
            
            result = await schema.execute(
                query,
                variable_values=variables,
                context_value=context
            )
            
            assert result.errors is None
            assert len(result.data["availableRewards"]) == 2

    @pytest.mark.asyncio
    async def test_points_history_query(self):
        """Test points history query with pagination"""
        query = """
        query GetPointsHistory($customerId: String!, $limit: Int, $offset: Int) {
          pointsHistory(customerId: $customerId, limit: $limit, offset: $offset) {
            id
            amount
            transaction_type
            reason
            created_at
          }
        }
        """
        
        variables = {
            "customerId": "test-customer-123",
            "limit": 10,
            "offset": 0
        }
        
        with patch('graphql_api.get_db') as mock_db, \
             patch('graphql_api.loyalty_service') as mock_loyalty_service:
            
            mock_session = AsyncMock()
            mock_db.return_value.__aenter__.return_value = mock_session
            
            # Mock profile lookup
            mock_profile = Mock()
            mock_profile.id = "profile-123"
            mock_loyalty_service.get_profile.return_value = mock_profile
            
            # Mock transactions
            mock_transactions = [
                Mock(
                    id="tx-1",
                    amount=100,
                    transaction_type="earned",
                    reason="Order purchase",
                    reference_id="order-123",
                    created_at=datetime.utcnow(),
                    expires_at=None
                ),
                Mock(
                    id="tx-2",
                    amount=-50,
                    transaction_type="redeemed",
                    reason="Discount redemption",
                    reference_id="redemption-456",
                    created_at=datetime.utcnow() - timedelta(days=1),
                    expires_at=None
                )
            ]
            
            mock_session.execute.return_value.scalars.return_value.all.return_value = mock_transactions
            
            context = {
                "db": mock_session,
                "shop_domain": "test.myshopify.com",
                "shop_id": "shop-id-123"
            }
            
            result = await schema.execute(
                query,
                variable_values=variables,
                context_value=context
            )
            
            assert result.errors is None
            assert len(result.data["pointsHistory"]) == 2


class TestGraphQLMutations:
    """Test GraphQL mutation functionality"""
    
    @pytest.mark.asyncio
    async def test_redeem_reward_mutation(self):
        """Test reward redemption mutation"""
        mutation = """
        mutation RedeemReward($input: RedeemRewardInput!) {
          redeemReward(input: $input) {
            success
            message
            redemption_id
            points_deducted
            new_balance
          }
        }
        """
        
        variables = {
            "input": {
                "customer_id": "test-customer-123",
                "reward_id": "reward-456",
                "quantity": 1
            }
        }
        
        with patch('graphql_api.get_db') as mock_db, \
             patch('graphql_api.loyalty_service') as mock_loyalty_service, \
             patch('graphql_api.publish_loyalty_event') as mock_publish:
            
            mock_session = AsyncMock()
            mock_db.return_value.__aenter__.return_value = mock_session
            
            # Mock successful redemption
            mock_profile = Mock()
            mock_profile.points_balance = 2000
            
            mock_reward = Mock()
            mock_reward.id = "reward-456"
            mock_reward.name = "Test Reward"
            mock_reward.points_cost = 500
            
            mock_updated_profile = Mock()
            mock_updated_profile.points_balance = 1500
            
            mock_loyalty_service.get_profile.return_value = mock_profile
            mock_loyalty_service.adjust_points.return_value = mock_updated_profile
            
            # Mock database queries
            mock_session.execute.return_value.scalar_one_or_none.side_effect = [
                "shop-id-123",  # Shop lookup
                mock_reward      # Reward lookup
            ]
            
            mock_publish.return_value = None
            
            context = {
                "db": mock_session,
                "shop_domain": "test.myshopify.com",
                "shop_id": "shop-id-123"
            }
            
            result = await schema.execute(
                mutation,
                variable_values=variables,
                context_value=context
            )
            
            assert result.errors is None
            assert result.data["redeemReward"]["success"] is True
            assert result.data["redeemReward"]["points_deducted"] == 500
            assert result.data["redeemReward"]["new_balance"] == 1500

    @pytest.mark.asyncio
    async def test_track_action_mutation(self):
        """Test action tracking mutation"""
        mutation = """
        mutation TrackAction($input: TrackActionInput!) {
          trackAction(input: $input)
        }
        """
        
        variables = {
            "input": {
                "customer_id": "test-customer-123",
                "action_type": "product_view",
                "metadata": "product-789"
            }
        }
        
        with patch('graphql_api.publish_loyalty_event') as mock_publish:
            mock_publish.return_value = None
            
            context = {
                "shop_domain": "test.myshopify.com"
            }
            
            result = await schema.execute(
                mutation,
                variable_values=variables,
                context_value=context
            )
            
            assert result.errors is None
            assert result.data["trackAction"] is True
            mock_publish.assert_called_once()


class TestDataLoaders:
    """Test DataLoader functionality for N+1 query prevention"""
    
    @pytest.mark.asyncio
    async def test_loyalty_profiles_dataloader(self):
        """Test loyalty profiles DataLoader"""
        from graphql_api import load_loyalty_profiles_by_customer_ids
        
        customer_ids = ["customer-1", "customer-2", "customer-3"]
        shop_id = "shop-123"
        
        with patch('graphql_api.get_db') as mock_db:
            mock_session = AsyncMock()
            
            # Mock database response
            mock_profiles = [
                Mock(shopify_customer_id="customer-1", points_balance=100),
                Mock(shopify_customer_id="customer-3", points_balance=300)
            ]
            
            mock_session.execute.return_value.scalars.return_value.all.return_value = mock_profiles
            
            results = await load_loyalty_profiles_by_customer_ids(
                customer_ids, mock_session, shop_id
            )
            
            # Should return results in same order as requested
            assert len(results) == 3
            assert results[0].shopify_customer_id == "customer-1"
            assert results[1] is None  # customer-2 not found
            assert results[2].shopify_customer_id == "customer-3"

    @pytest.mark.asyncio
    async def test_rewards_dataloader(self):
        """Test rewards DataLoader"""
        from graphql_api import load_rewards_by_shop_ids
        
        shop_ids = ["shop-1", "shop-2"]
        
        with patch('graphql_api.get_db') as mock_db:
            mock_session = AsyncMock()
            
            # Mock database response
            mock_rewards = [
                Mock(shop_id="shop-1", name="Reward 1"),
                Mock(shop_id="shop-1", name="Reward 2"),
                Mock(shop_id="shop-2", name="Reward 3")
            ]
            
            mock_session.execute.return_value.scalars.return_value.all.return_value = mock_rewards
            
            results = await load_rewards_by_shop_ids(shop_ids, mock_session)
            
            # Should group by shop_id
            assert len(results) == 2
            assert len(results[0]) == 2  # shop-1 has 2 rewards
            assert len(results[1]) == 1  # shop-2 has 1 reward


class TestGraphQLPerformance:
    """Test GraphQL performance and optimization"""
    
    @pytest.mark.asyncio
    async def test_query_complexity_analysis(self):
        """Test query complexity analysis"""
        # This would test query complexity limits
        complex_query = """
        query ComplexQuery {
          loyaltyProfile(customerId: "test") {
            id
            transaction_history(limit: 100) {
              id
              amount
            }
            recommended_rewards {
              id
              name
            }
          }
        }
        """
        
        # In a real implementation, you'd have query complexity analysis
        # that would reject overly complex queries
        pass

    @pytest.mark.asyncio
    async def test_dataloader_batching(self):
        """Test DataLoader batching efficiency"""
        # This would test that DataLoaders properly batch database queries
        # instead of making N+1 queries
        pass

    def test_query_caching(self):
        """Test GraphQL query result caching"""
        # This would test query result caching for frequently accessed data
        pass


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
