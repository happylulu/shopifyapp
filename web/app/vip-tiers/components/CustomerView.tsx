import React, { useState } from 'react';
import {
  BlockStack,
  InlineStack,
  Text,
  Box,
  Card,
  Button,
  Badge,
  ProgressBar,
  Grid,
  Icon,
  Banner,
  Divider,
  Select,
  EmptyState
} from '@shopify/polaris';
import {
  StarIcon,
  GiftCardIcon,
  StarFilledIcon,
  ClockIcon,
  CheckIcon,
  LockIcon
} from '@shopify/polaris-icons';
import { VIPProgramConfig, VIPAnalytics, VIPTierLevel, VIPMember } from '../../types/vip';

interface CustomerViewProps {
  config: VIPProgramConfig | null;
  analytics: VIPAnalytics | null;
}

export function CustomerView({ config, analytics }: CustomerViewProps) {
  const [selectedCustomer, setSelectedCustomer] = useState<string>('cust_001');
  
  if (!config || !analytics) {
    return (
      <BlockStack gap="400">
        <Text as="p">Loading customer view...</Text>
      </BlockStack>
    );
  }

  // Mock customer data for demonstration
  const mockCustomers: Record<string, VIPMember> = {
    'cust_001': {
      id: 'vip_001',
      customer_id: 'cust_001',
      customer_name: 'Sarah Chen',
      customer_email: 'sarah@example.com',
      current_tier: VIPTierLevel.GOLD,
      tier_started_at: '2024-01-15T00:00:00Z',
      tier_expires_at: '2025-01-15T00:00:00Z',
      total_spent: 3842.50,
      total_points: 38425,
      total_orders: 23,
      spent_this_period: 1152.75,
      points_this_period: 11527,
      orders_this_period: 7,
      next_tier: VIPTierLevel.PLATINUM,
      progress_to_next_tier: 65,
      amount_to_next_tier: 1157.50,
      benefits_used: {
        'gold_points': 23,
        'gold_discount': 5,
        'gold_support': 2
      },
      lifetime_value: 4611.00,
      is_active: true,
      joined_vip_at: '2023-06-10T00:00:00Z',
      last_activity_at: '2024-01-20T00:00:00Z'
    },
    'cust_002': {
      id: 'vip_002',
      customer_id: 'cust_002',
      customer_name: 'Michael Johnson',
      customer_email: 'michael@example.com',
      current_tier: VIPTierLevel.PLATINUM,
      tier_started_at: '2023-11-01T00:00:00Z',
      tier_expires_at: '2024-11-01T00:00:00Z',
      total_spent: 7234.00,
      total_points: 72340,
      total_orders: 45,
      spent_this_period: 2170.20,
      points_this_period: 21702,
      orders_this_period: 13,
      next_tier: undefined,
      progress_to_next_tier: 100,
      amount_to_next_tier: 0,
      benefits_used: {
        'platinum_points': 45,
        'platinum_discount': 12,
        'platinum_concierge': 3
      },
      lifetime_value: 8680.80,
      is_active: true,
      joined_vip_at: '2022-03-15T00:00:00Z',
      last_activity_at: '2024-01-22T00:00:00Z'
    },
    'cust_003': {
      id: 'vip_003',
      customer_id: 'cust_003',
      customer_name: 'Emma Davis',
      customer_email: 'emma@example.com',
      current_tier: VIPTierLevel.BRONZE,
      tier_started_at: '2024-01-01T00:00:00Z',
      tier_expires_at: '2025-01-01T00:00:00Z',
      total_spent: 645.80,
      total_points: 6458,
      total_orders: 5,
      spent_this_period: 645.80,
      points_this_period: 6458,
      orders_this_period: 5,
      next_tier: VIPTierLevel.SILVER,
      progress_to_next_tier: 43,
      amount_to_next_tier: 854.20,
      benefits_used: {
        'bronze_points': 5
      },
      lifetime_value: 774.96,
      is_active: true,
      joined_vip_at: '2024-01-01T00:00:00Z',
      last_activity_at: '2024-01-18T00:00:00Z'
    }
  };

  const currentCustomer = mockCustomers[selectedCustomer];
  const currentTier = config.tiers.find(t => t.level === currentCustomer.current_tier);
  const nextTier = currentCustomer.next_tier ? config.tiers.find(t => t.level === currentCustomer.next_tier) : null;
  
  // Get all tiers for display
  const allTiers = config.tiers;
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Calculate days until tier expiration
  const daysUntilExpiration = () => {
    if (!currentCustomer.tier_expires_at) return null;
    const expires = new Date(currentCustomer.tier_expires_at);
    const today = new Date();
    const diffTime = expires.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const expirationDays = daysUntilExpiration();

  return (
    <BlockStack gap="600">
      {/* Customer Selector (for demo) */}
      <Card>
        <BlockStack gap="300">
          <Text as="h3" variant="headingSm">Preview as Customer</Text>
          <Select
            label="Select customer to preview"
            options={[
              { label: 'Sarah Chen (Gold)', value: 'cust_001' },
              { label: 'Michael Johnson (Platinum)', value: 'cust_002' },
              { label: 'Emma Davis (Bronze)', value: 'cust_003' }
            ]}
            value={selectedCustomer}
            onChange={setSelectedCustomer}
          />
        </BlockStack>
      </Card>

      {/* Customer's VIP Status */}
      <Card>
        <BlockStack gap="400">
          <InlineStack align="space-between">
            <BlockStack gap="200">
              <Text as="h2" variant="headingLg">Your VIP Status</Text>
              <InlineStack gap="300" align="center">
                <Text as="span" variant="heading2xl">{currentTier?.icon}</Text>
                <BlockStack gap="100">
                  <Badge tone="info" size="large">
                    {currentTier?.name}
                  </Badge>
                  <Text as="p" variant="bodySm" tone="subdued">
                    Member since {formatDate(currentCustomer.joined_vip_at)}
                  </Text>
                </BlockStack>
              </InlineStack>
            </BlockStack>
            
            {expirationDays && expirationDays > 0 && (
              <Box background="bg-surface-secondary" padding="300" borderRadius="200">
                <BlockStack gap="100">
                  <Text as="p" variant="bodySm" tone="subdued">Status expires in</Text>
                  <Text as="p" variant="headingMd" fontWeight="bold">
                    {expirationDays} days
                  </Text>
                </BlockStack>
              </Box>
            )}
          </InlineStack>

          <Divider />

          {/* Progress to Next Tier */}
          {nextTier ? (
            <BlockStack gap="300">
              <InlineStack align="space-between">
                <Text as="h3" variant="headingSm">Progress to {nextTier.name}</Text>
                <Text as="p" variant="bodySm" tone="subdued">
                  ${currentCustomer.amount_to_next_tier?.toFixed(2)} to go
                </Text>
              </InlineStack>
              <ProgressBar progress={currentCustomer.progress_to_next_tier / 100} size="medium" />
              <InlineStack align="space-between">
                <Text as="p" variant="bodySm">
                  ${currentCustomer.spent_this_period.toFixed(2)} spent this year
                </Text>
                <Text as="p" variant="bodySm" fontWeight="semibold">
                  {currentCustomer.progress_to_next_tier}% complete
                </Text>
              </InlineStack>
            </BlockStack>
          ) : (
            <Box background="bg-surface-success" padding="300" borderRadius="200">
              <InlineStack gap="200" align="center">
                <Icon source={CheckIcon} tone="success" />
                <Text as="p" variant="bodyMd">
                  You&apos;ve reached our highest tier! Thank you for being a valued customer.
                </Text>
              </InlineStack>
            </Box>
          )}
        </BlockStack>
      </Card>

      {/* Current Benefits */}
      <Card>
        <BlockStack gap="400">
          <Text as="h2" variant="headingLg">Your VIP Benefits</Text>
          <Grid>
            {currentTier?.benefits.map((benefit) => (
              <Grid.Cell key={benefit.id} columnSpan={{ xs: 6, sm: 6, md: 6, lg: 6, xl: 6 }}>
                <Box background="bg-surface-secondary" padding="400" borderRadius="200">
                  <InlineStack gap="300" align="start">
                    <Text as="span" variant="headingLg">{benefit.icon}</Text>
                    <BlockStack gap="100">
                      <Text as="p" variant="bodyMd" fontWeight="semibold">
                        {benefit.name}
                      </Text>
                      <Text as="p" variant="bodySm" tone="subdued">
                        {benefit.description}
                      </Text>
                      {currentCustomer.benefits_used[benefit.id] && (
                        <Text as="p" variant="bodySm" tone="success">
                          Used {currentCustomer.benefits_used[benefit.id]} times
                        </Text>
                      )}
                    </BlockStack>
                  </InlineStack>
                </Box>
              </Grid.Cell>
            ))}
          </Grid>
        </BlockStack>
      </Card>

      {/* All Tiers Overview */}
      <Card>
        <BlockStack gap="400">
          <Text as="h2" variant="headingLg">VIP Tiers</Text>
          <BlockStack gap="300">
            {allTiers.map((tier) => {
              const isCurrentTier = tier.level === currentCustomer.current_tier;
              const tierIndex = allTiers.findIndex(t => t.level === tier.level);
              const currentTierIndex = allTiers.findIndex(t => t.level === currentCustomer.current_tier);
              const isUnlocked = tierIndex <= currentTierIndex;
              
              return (
                <Box
                  key={tier.id}
                  background={isCurrentTier ? "bg-surface-success" : isUnlocked ? "bg-surface" : "bg-surface-secondary"}
                  padding="400"
                  borderRadius="200"
                  borderColor={isCurrentTier ? "border-success" : "border"}
                  borderWidth="025"
                >
                  <InlineStack align="space-between">
                    <InlineStack gap="400" align="center">
                      <Text as="span" variant="headingXl">{tier.icon}</Text>
                      <BlockStack gap="100">
                        <InlineStack gap="200" align="center">
                          <Text as="h3" variant="headingMd">
                            {tier.name}
                          </Text>
                          {isCurrentTier && (
                            <Badge tone="success">Current Tier</Badge>
                          )}
                          {!isUnlocked && (
                            <Icon source={LockIcon} tone="subdued" />
                          )}
                        </InlineStack>
                        <Text as="p" variant="bodySm" tone={isUnlocked ? "base" : "subdued"}>
                          {tier.description}
                        </Text>
                      </BlockStack>
                    </InlineStack>
                    
                    <BlockStack gap="100" align="end">
                      <Text as="p" variant="bodySm" tone="subdued">
                        Spend ${tier.min_spent?.toLocaleString()} per year
                      </Text>
                      <Text as="p" variant="bodySm" fontWeight="semibold">
                        {tier.points_multiplier}x points
                      </Text>
                    </BlockStack>
                  </InlineStack>
                  
                  {/* Show benefits preview */}
                  {!isCurrentTier && (
                    <Box paddingBlockStart="300">
                      <Divider />
                      <Box paddingBlockStart="300">
                        <InlineStack gap="300" wrap>
                          {tier.benefits.slice(0, 3).map((benefit) => (
                            <Badge key={benefit.id} tone={isUnlocked ? "info" : "new"}>
                              {`${benefit.icon} ${benefit.name}`}
                            </Badge>
                          ))}
                          {tier.benefits.length > 3 && (
                            <Text as="span" variant="bodySm" tone="subdued">
                              +{tier.benefits.length - 3} more
                            </Text>
                          )}
                        </InlineStack>
                      </Box>
                    </Box>
                  )}
                </Box>
              );
            })}
          </BlockStack>
        </BlockStack>
      </Card>

      {/* Activity Summary */}
      <Card>
        <BlockStack gap="400">
          <Text as="h2" variant="headingLg">Your VIP Activity</Text>
          <Grid>
            <Grid.Cell columnSpan={{ xs: 4, sm: 4, md: 4, lg: 4, xl: 4 }}>
              <BlockStack gap="100">
                <InlineStack gap="200" align="center">
                  <Icon source={StarIcon} tone="base" />
                  <Text as="p" variant="bodySm" tone="subdued">Total Points</Text>
                </InlineStack>
                <Text as="p" variant="headingMd" fontWeight="bold">
                  {currentCustomer.total_points.toLocaleString()}
                </Text>
                <Text as="p" variant="bodySm" tone="success">
                  {currentCustomer.points_this_period.toLocaleString()} this year
                </Text>
              </BlockStack>
            </Grid.Cell>
            
            <Grid.Cell columnSpan={{ xs: 4, sm: 4, md: 4, lg: 4, xl: 4 }}>
              <BlockStack gap="100">
                <InlineStack gap="200" align="center">
                  <Icon source={GiftCardIcon} tone="base" />
                  <Text as="p" variant="bodySm" tone="subdued">Total Spent</Text>
                </InlineStack>
                <Text as="p" variant="headingMd" fontWeight="bold">
                  ${currentCustomer.total_spent.toLocaleString()}
                </Text>
                <Text as="p" variant="bodySm" tone="success">
                  ${currentCustomer.spent_this_period.toFixed(2)} this year
                </Text>
              </BlockStack>
            </Grid.Cell>
            
            <Grid.Cell columnSpan={{ xs: 4, sm: 4, md: 4, lg: 4, xl: 4 }}>
              <BlockStack gap="100">
                <InlineStack gap="200" align="center">
                  <Icon source={StarFilledIcon} tone="base" />
                  <Text as="p" variant="bodySm" tone="subdued">Total Orders</Text>
                </InlineStack>
                <Text as="p" variant="headingMd" fontWeight="bold">
                  {currentCustomer.total_orders}
                </Text>
                <Text as="p" variant="bodySm" tone="success">
                  {currentCustomer.orders_this_period} this year
                </Text>
              </BlockStack>
            </Grid.Cell>
          </Grid>
        </BlockStack>
      </Card>

      {/* Help Section */}
      <Box background="bg-surface-secondary" padding="400" borderRadius="200">
        <BlockStack gap="300">
          <Text as="h3" variant="headingSm">How VIP Tiers Work</Text>
          <BlockStack gap="200">
            <InlineStack gap="200" align="start">
              <Text as="span">📈</Text>
              <Text as="p" variant="bodySm">
                Earn VIP status by spending ${config.tiers[0].min_spent} or more per year
              </Text>
            </InlineStack>
            <InlineStack gap="200" align="start">
              <Text as="span">⭐</Text>
              <Text as="p" variant="bodySm">
                Higher tiers earn more points on every purchase
              </Text>
            </InlineStack>
            <InlineStack gap="200" align="start">
              <Text as="span">🎁</Text>
              <Text as="p" variant="bodySm">
                Unlock exclusive benefits and perks as you progress
              </Text>
            </InlineStack>
            <InlineStack gap="200" align="start">
              <Text as="span">📅</Text>
              <Text as="p" variant="bodySm">
                Your tier status is evaluated annually based on your spending
              </Text>
            </InlineStack>
          </BlockStack>
        </BlockStack>
      </Box>
    </BlockStack>
  );
} 