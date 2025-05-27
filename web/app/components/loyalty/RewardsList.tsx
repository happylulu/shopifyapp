"use client";

import { 
  ResourceList, 
  ResourceItem, 
  Text, 
  Badge, 
  Button, 
  InlineStack,
  Stack,
  Box,
  Card,
  EmptyState
} from "@shopify/polaris";
import { useEffect, useState } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";

interface Reward {
  id: string;
  name: string;
  description: string;
  points_cost: number;
  reward_type: string;
  is_active: boolean;
  usage_limit?: number;
  usage_count?: number;
}

interface RewardsListProps {
  customerPoints: number;
  onRedeemClick: (reward: Reward) => void;
}

export function RewardsList({ customerPoints, onRedeemClick }: RewardsListProps) {
  const shopify = useAppBridge();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRewards() {
      try {
        setLoading(true);
        
        const response = await fetch('/api/rewards/');
        if (!response.ok) {
          throw new Error('Failed to fetch rewards');
        }
        
        const data = await response.json();
        setRewards(data);
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        shopify.toast.show('Failed to load rewards', { isError: true });
      } finally {
        setLoading(false);
      }
    }

    fetchRewards();
  }, [shopify]);

  const getRewardBadge = (reward: Reward) => {
    if (!reward.is_active) {
      return <Badge tone="critical">Inactive</Badge>;
    }
    
    if (reward.usage_limit && reward.usage_count && reward.usage_count >= reward.usage_limit) {
      return <Badge tone="attention">Sold Out</Badge>;
    }
    
    if (customerPoints < reward.points_cost) {
      return <Badge tone="subdued">Insufficient Points</Badge>;
    }
    
    return <Badge tone="success">Available</Badge>;
  };

  const canRedeem = (reward: Reward) => {
    return reward.is_active && 
           customerPoints >= reward.points_cost &&
           (!reward.usage_limit || !reward.usage_count || reward.usage_count < reward.usage_limit);
  };

  const getRewardTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'discount':
        return '💰';
      case 'free_shipping':
        return '🚚';
      case 'product':
        return '🎁';
      case 'experience':
        return '✨';
      default:
        return '🎯';
    }
  };

  if (loading) {
    return (
      <Card>
        <Box padding="400">
          <Text as="p">Loading rewards...</Text>
        </Box>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <Box padding="400">
          <Text as="p" tone="critical">
            {error}
          </Text>
        </Box>
      </Card>
    );
  }

  if (rewards.length === 0) {
    return (
      <Card>
        <EmptyState
          heading="No rewards available"
          image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
        >
          <Text as="p">
            Check back later for exciting rewards you can redeem with your points!
          </Text>
        </EmptyState>
      </Card>
    );
  }

  const renderRewardItem = (id: string, index: number) => {
    const reward = rewards[index];
    
    return (
      <ResourceItem
        id={id}
        key={id}
        accessibilityLabel={`Reward: ${reward.name}`}
      >
        <InlineStack align="space-between" blockAlign="center">
          <Stack gap="200">
            <InlineStack gap="200" blockAlign="center">
              <Text as="span" variant="bodyLg">
                {getRewardTypeIcon(reward.reward_type)}
              </Text>
              <Text as="h3" variant="bodyMd" fontWeight="semibold">
                {reward.name}
              </Text>
              {getRewardBadge(reward)}
            </InlineStack>
            
            <Text as="p" tone="subdued">
              {reward.description}
            </Text>
            
            <InlineStack gap="300">
              <Text as="p" variant="bodyMd" fontWeight="medium">
                {reward.points_cost.toLocaleString()} points
              </Text>
              
              {reward.usage_limit && (
                <Text as="p" tone="subdued">
                  {reward.usage_count || 0} / {reward.usage_limit} redeemed
                </Text>
              )}
            </InlineStack>
          </Stack>
          
          <Button
            variant={canRedeem(reward) ? "primary" : "plain"}
            disabled={!canRedeem(reward)}
            onClick={() => onRedeemClick(reward)}
          >
            {canRedeem(reward) ? 'Redeem' : 'Unavailable'}
          </Button>
        </InlineStack>
      </ResourceItem>
    );
  };

  // Sort rewards: available first, then by points cost
  const sortedRewards = [...rewards].sort((a, b) => {
    const aCanRedeem = canRedeem(a);
    const bCanRedeem = canRedeem(b);
    
    if (aCanRedeem && !bCanRedeem) return -1;
    if (!aCanRedeem && bCanRedeem) return 1;
    
    return a.points_cost - b.points_cost;
  });

  return (
    <Card>
      <ResourceList
        resourceName={{ singular: 'reward', plural: 'rewards' }}
        items={sortedRewards.map((reward, index) => ({
          id: reward.id,
          ...reward
        }))}
        renderItem={renderRewardItem}
        headerContent={
          <Box padding="400">
            <Stack gap="200">
              <Text as="h2" variant="headingMd">
                Available Rewards
              </Text>
              <Text as="p" tone="subdued">
                You have {customerPoints.toLocaleString()} points to spend
              </Text>
            </Stack>
          </Box>
        }
      />
    </Card>
  );
}
