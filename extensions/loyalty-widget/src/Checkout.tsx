import React, { useState, useEffect, useCallback } from 'react';
import {
  reactExtension,
  Banner,
  BlockStack,
  Text,
  InlineLayout,
  Button,
  SkeletonText,
  useSettings,
  useCustomer,
  useApi,
  useApplyCartLinesChange,
  useCartLines,
  useShop,
} from '@shopify/ui-extensions-react/checkout';

interface LoyaltyProfile {
  points_balance: number;
  current_tier?: {
    name: string;
    level: number;
  };
  next_tier?: {
    name: string;
    min_points_required: number;
  };
  points_to_next_tier?: number;
  tier_progress_percentage: number;
}

interface Reward {
  id: string;
  name: string;
  points_cost: number;
  description?: string;
}

export default reactExtension('purchase.checkout.block.render', () => <LoyaltyWidget />);

function LoyaltyWidget() {
  const { title, show_points, show_tier, show_rewards } = useSettings();
  const customer = useCustomer();
  const shop = useShop();
  const { query } = useApi();
  const applyCartLinesChange = useApplyCartLinesChange();
  const cartLines = useCartLines();

  const [loyaltyProfile, setLoyaltyProfile] = useState<LoyaltyProfile | null>(null);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [redeeming, setRedeeming] = useState<string | null>(null);
  const [earnedPoints, setEarnedPoints] = useState<number | null>(null);

  useEffect(() => {
    if (customer?.id) {
      loadLoyaltyData();
    }
  }, [customer?.id]);

  // Calculate potential points from current cart
  const calculateCartPoints = useCallback(() => {
    if (!cartLines || cartLines.length === 0) return 0;

    const cartTotal = cartLines.reduce((total, line) => {
      return total + (line.cost?.totalAmount?.amount || 0);
    }, 0);

    // Assume 1 point per dollar spent (this would come from your loyalty rules)
    return Math.floor(cartTotal);
  }, [cartLines]);

  const loadLoyaltyData = async () => {
    try {
      setLoading(true);

      // Enhanced GraphQL query with fragments
      const loyaltyQuery = `
        fragment TierInfo on Tier {
          id
          name
          level
          min_points_required
          description
          benefits
          icon_url
          color
        }

        fragment RewardInfo on Reward {
          id
          name
          description
          points_cost
          reward_type
          value
          image_url
          category
          available
          terms_and_conditions
          expires_at
        }

        query GetLoyaltyProfile($customerId: String!) {
          loyaltyProfile(customerId: $customerId) {
            id
            customer_id
            points_balance
            lifetime_points
            current_tier {
              ...TierInfo
            }
            next_tier {
              ...TierInfo
            }
            points_to_next_tier
            tier_progress_percentage
            member_since
            last_activity
          }
          availableRewards(customerId: $customerId, maxPoints: 2000) {
            ...RewardInfo
          }
          earningOpportunities(customerId: $customerId) {
            action
            points
            description
            url
            available
          }
        }
      `;

      const response = await query(loyaltyQuery, {
        variables: { customerId: customer?.id },
        headers: {
          'X-Shopify-Shop-Domain': shop?.myshopifyDomain || shop?.domain,
          'Content-Type': 'application/json'
        }
      });

      if (response.data) {
        setLoyaltyProfile(response.data.loyaltyProfile);
        setRewards(response.data.availableRewards || []);

        // Calculate points that will be earned from current cart
        const cartPoints = calculateCartPoints();
        setEarnedPoints(cartPoints);
      }
    } catch (err) {
      setError('Failed to load loyalty data');
      console.error('Loyalty data error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle reward redemption
  const handleRedeemReward = async (rewardId: string, rewardName: string, pointsCost: number) => {
    if (!customer?.id || !loyaltyProfile) return;

    try {
      setRedeeming(rewardId);

      const redeemMutation = `
        mutation RedeemReward($input: RedeemRewardInput!) {
          redeemReward(input: $input) {
            success
            message
            redemption_id
            discount_code
            points_deducted
            new_balance
          }
        }
      `;

      const response = await query(redeemMutation, {
        variables: {
          input: {
            customer_id: customer.id,
            reward_id: rewardId,
            quantity: 1
          }
        },
        headers: {
          'X-Shopify-Shop-Domain': shop?.myshopifyDomain || shop?.domain,
          'Content-Type': 'application/json'
        }
      });

      if (response.data?.redeemReward?.success) {
        const result = response.data.redeemReward;

        // Update local state optimistically
        setLoyaltyProfile(prev => prev ? {
          ...prev,
          points_balance: result.new_balance || (prev.points_balance - pointsCost)
        } : null);

        // If there's a discount code, apply it to the cart
        if (result.discount_code) {
          // This would integrate with Shopify's discount API
          console.log('Discount code generated:', result.discount_code);
        }

        // Show success message
        console.log(`Successfully redeemed ${rewardName}!`);

        // Reload data to get fresh state
        await loadLoyaltyData();
      } else {
        setError(response.data?.redeemReward?.message || 'Redemption failed');
      }
    } catch (err) {
      setError('Failed to redeem reward');
      console.error('Redemption error:', err);
    } finally {
      setRedeeming(null);
    }
  };

  if (!customer?.id) {
    return null; // Don't show for guest checkout
  }

  if (loading) {
    return (
      <Banner title={title || "Loyalty Program"}>
        <BlockStack spacing="tight">
          <SkeletonText inlineSize="large" />
          <SkeletonText inlineSize="medium" />
        </BlockStack>
      </Banner>
    );
  }

  if (error || !loyaltyProfile) {
    return (
      <Banner title={title || "Loyalty Program"} status="warning">
        <Text>Unable to load loyalty information</Text>
      </Banner>
    );
  }

  return (
    <Banner title={title || "Loyalty Program"} status="success">
      <BlockStack spacing="base">
        {show_points && (
          <InlineLayout spacing="tight" blockAlignment="center">
            <Text emphasis="strong">Points Balance:</Text>
            <Text appearance="accent">{loyaltyProfile.points_balance.toLocaleString()}</Text>
          </InlineLayout>
        )}

        {show_tier && loyaltyProfile.current_tier && (
          <BlockStack spacing="tight">
            <InlineLayout spacing="tight" blockAlignment="center">
              <Text emphasis="strong">Current Tier:</Text>
              <Text appearance="accent">{loyaltyProfile.current_tier.name}</Text>
            </InlineLayout>

            {loyaltyProfile.next_tier && loyaltyProfile.points_to_next_tier && (
              <Text size="small" appearance="subdued">
                {loyaltyProfile.points_to_next_tier} points to {loyaltyProfile.next_tier.name}
              </Text>
            )}
          </BlockStack>
        )}

        {show_rewards && rewards.length > 0 && (
          <BlockStack spacing="tight">
            <Text emphasis="strong">Available Rewards:</Text>
            {rewards.slice(0, 3).map((reward) => (
              <InlineLayout key={reward.id} spacing="tight" blockAlignment="center">
                <Text size="small">{reward.name}</Text>
                <Text size="small" appearance="accent">
                  {reward.points_cost} pts
                </Text>
              </InlineLayout>
            ))}
            {rewards.length > 3 && (
              <Text size="small" appearance="subdued">
                +{rewards.length - 3} more rewards available
              </Text>
            )}
          </BlockStack>
        )}

        <Button
          kind="secondary"
          onPress={() => {
            // Open loyalty portal or redirect to account page
            window.open('/account/loyalty', '_blank');
          }}
        >
          View Loyalty Dashboard
        </Button>
      </BlockStack>
    </Banner>
  );
}
