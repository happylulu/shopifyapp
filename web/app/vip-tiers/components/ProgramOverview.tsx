import React from 'react';
import {
  BlockStack,
  InlineStack,
  Text,
  Box,
  Card,
  Icon,
  Button,
  Badge,
  Grid,
  Divider
} from '@shopify/polaris';
import {
  StarIcon,
  GiftCardIcon,
  StarFilledIcon,
  SettingsIcon
} from '@shopify/polaris-icons';
import { VIPProgramConfig, VIPAnalytics, VIPTierLevel } from '../../types/vip';

interface ProgramOverviewProps {
  config: VIPProgramConfig | null;
  analytics: VIPAnalytics | null;
  onRefresh: () => void;
}

export function ProgramOverview({ config, analytics, onRefresh }: ProgramOverviewProps) {
  if (!config) {
    return (
      <BlockStack gap="400">
        <Text as="p">Loading program configuration...</Text>
      </BlockStack>
    );
  }

  const tierColors = {
    [VIPTierLevel.BRONZE]: '#CD7F32',
    [VIPTierLevel.SILVER]: '#C0C0C0',
    [VIPTierLevel.GOLD]: '#FFD700',
    [VIPTierLevel.PLATINUM]: '#E5E4E2',
  };

  const benefitIcons = {
    points_multiplier: '⭐',
    exclusive_discount: '💰',
    free_shipping: '📦',
    early_access: '⏰',
    birthday_reward: '🎂',
    priority_support: '🎯',
    exclusive_products: '👑',
    custom_benefit: '🎁',
  };

  return (
    <BlockStack gap="600">
      {/* Program Status */}
      <Box background="bg-surface-secondary" padding="400" borderRadius="200">
        <InlineStack align="space-between">
          <BlockStack gap="200">
            <Text as="h3" variant="headingSm">Program Status</Text>
            <InlineStack gap="200" align="center">
              <Badge tone={config.is_active ? 'success' : 'info'}>
                {config.is_active ? 'Active' : 'Inactive'}
              </Badge>
              <Text as="p" variant="bodySm" tone="subdued">
                {config.is_active ? 'Your VIP program is live' : 'Launch when ready'}
              </Text>
            </InlineStack>
          </BlockStack>
          <Button onClick={onRefresh} variant="plain">Refresh Data</Button>
        </InlineStack>
      </Box>

      {/* Tier Overview */}
      <BlockStack gap="400">
        <Text as="h3" variant="headingMd">VIP Tiers</Text>
        <Grid>
          {config.tiers.map((tier) => (
            <Grid.Cell key={tier.id} columnSpan={{ xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }}>
              <Card>
                <BlockStack gap="300">
                  <InlineStack align="space-between">
                    <Box>
                      <Text as="span" variant="headingLg">{tier.icon}</Text>
                    </Box>
                    <Badge tone="info">
                      {`${analytics?.members_by_tier[tier.level] || 0} members`}
                    </Badge>
                  </InlineStack>
                  
                  <BlockStack gap="100">
                    <Text as="h4" variant="headingSm" fontWeight="bold">
                      {tier.name}
                    </Text>
                    <Text as="p" variant="bodySm" tone="subdued">
                      {tier.description}
                    </Text>
                  </BlockStack>

                  <Divider />

                  <BlockStack gap="200">
                    <InlineStack gap="200" align="start">
                      <Text as="span" variant="bodySm" fontWeight="semibold">Qualification:</Text>
                      <Text as="span" variant="bodySm">
                        ${tier.min_spent?.toLocaleString() || 0} spent
                      </Text>
                    </InlineStack>
                    <InlineStack gap="200" align="start">
                      <Text as="span" variant="bodySm" fontWeight="semibold">Points:</Text>
                      <Text as="span" variant="bodySm">
                        {tier.points_multiplier}x multiplier
                      </Text>
                    </InlineStack>
                    <InlineStack gap="200" align="start">
                      <Text as="span" variant="bodySm" fontWeight="semibold">Benefits:</Text>
                      <Text as="span" variant="bodySm">
                        {tier.benefits.length} perks
                      </Text>
                    </InlineStack>
                  </BlockStack>

                  <Box paddingBlockStart="200">
                    <BlockStack gap="100">
                      {tier.benefits.slice(0, 3).map((benefit) => (
                        <InlineStack key={benefit.id} gap="100" align="start">
                          <Text as="span" variant="bodySm">
                            {benefitIcons[benefit.type] || '•'}
                          </Text>
                          <Text as="span" variant="bodySm" tone="subdued">
                            {benefit.name}
                          </Text>
                        </InlineStack>
                      ))}
                      {tier.benefits.length > 3 && (
                        <Text as="p" variant="bodySm" tone="subdued">
                          +{tier.benefits.length - 3} more benefits
                        </Text>
                      )}
                    </BlockStack>
                  </Box>
                </BlockStack>
              </Card>
            </Grid.Cell>
          ))}
        </Grid>
      </BlockStack>

      {/* Key Features */}
      <BlockStack gap="400">
        <Text as="h3" variant="headingMd">Key Features</Text>
        <Grid>
          <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }}>
            <Box background="bg-surface-secondary" padding="400" borderRadius="200">
              <BlockStack gap="200">
                <Icon source={StarIcon} tone="base" />
                <Text as="h4" variant="headingSm">Entry Rewards</Text>
                <Text as="p" variant="bodySm" tone="subdued">
                  Instant rewards when customers reach new tiers
                </Text>
                <BlockStack gap="100">
                  <Text as="p" variant="bodySm">✓ Bonus points awards upon tier upgrade</Text>
                  <Text as="p" variant="bodySm">✓ Instant discount coupons for next purchase</Text>
                  <Text as="p" variant="bodySm">✓ Limited edition products for top tiers</Text>
                </BlockStack>
              </BlockStack>
            </Box>
          </Grid.Cell>

          <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }}>
            <Box background="bg-surface-secondary" padding="400" borderRadius="200">
              <BlockStack gap="200">
                <Icon source={StarFilledIcon} tone="base" />
                <Text as="h4" variant="headingSm">Accelerated Points</Text>
                <Text as="p" variant="bodySm" tone="subdued">
                  Top-tier members earn points faster
                </Text>
                <BlockStack gap="100">
                  <Text as="p" variant="bodySm">✓ Double point multipliers for Gold members</Text>
                  <Text as="p" variant="bodySm">✓ 1.5x points for Silver members</Text>
                  <Text as="p" variant="bodySm">✓ Bonus point events for all VIPs</Text>
                </BlockStack>
              </BlockStack>
            </Box>
          </Grid.Cell>

          <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }}>
            <Box background="bg-surface-secondary" padding="400" borderRadius="200">
              <BlockStack gap="200">
                <Icon source={GiftCardIcon} tone="base" />
                <Text as="h4" variant="headingSm">Exclusive Perks</Text>
                <Text as="p" variant="bodySm" tone="subdued">
                  Ongoing benefits for loyal customers
                </Text>
                <BlockStack gap="100">
                  <Text as="p" variant="bodySm">✓ Early access to new products</Text>
                  <Text as="p" variant="bodySm">✓ Exclusive VIP-only products</Text>
                  <Text as="p" variant="bodySm">✓ Priority customer support</Text>
                </BlockStack>
              </BlockStack>
            </Box>
          </Grid.Cell>

          <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }}>
            <Box background="bg-surface-secondary" padding="400" borderRadius="200">
              <BlockStack gap="200">
                <Icon source={SettingsIcon} tone="base" />
                <Text as="h4" variant="headingSm">Flexible Structure</Text>
                <Text as="p" variant="bodySm" tone="subdued">
                  Choose between points or spend-based tiers
                </Text>
                <BlockStack gap="100">
                  <Text as="p" variant="bodySm">✓ Total points or total spend qualification</Text>
                  <Text as="p" variant="bodySm">✓ Calendar year or lifetime period options</Text>
                  <Text as="p" variant="bodySm">✓ Customizable tier requirements</Text>
                </BlockStack>
              </BlockStack>
            </Box>
          </Grid.Cell>
        </Grid>
      </BlockStack>

      {/* VIP Tier Analytics */}
      <BlockStack gap="400">
        <Text as="h3" variant="headingMd">VIP Tier Analytics</Text>
        <Card>
          <BlockStack gap="300">
            <Grid>
              <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }}>
                <BlockStack gap="100">
                  <Text as="p" variant="bodySm" tone="subdued">Total VIP Revenue</Text>
                  <Text as="p" variant="headingMd" fontWeight="bold">
                    ${analytics?.total_vip_revenue.toLocaleString() || '0'}
                  </Text>
                </BlockStack>
              </Grid.Cell>
              <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }}>
                <BlockStack gap="100">
                  <Text as="p" variant="bodySm" tone="subdued">Benefits Redemption</Text>
                  <Text as="p" variant="headingMd" fontWeight="bold">
                    {analytics ? `${(analytics.benefits_redemption_rate * 100).toFixed(0)}%` : '0%'}
                  </Text>
                </BlockStack>
              </Grid.Cell>
              <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }}>
                <BlockStack gap="100">
                  <Text as="p" variant="bodySm" tone="subdued">Tier Progression</Text>
                  <Text as="p" variant="headingMd" fontWeight="bold">
                    {analytics ? `${(analytics.tier_progression_rate * 100).toFixed(0)}%` : '0%'}
                  </Text>
                </BlockStack>
              </Grid.Cell>
              <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }}>
                <BlockStack gap="100">
                  <Text as="p" variant="bodySm" tone="subdued">New VIPs (30d)</Text>
                  <Text as="p" variant="headingMd" fontWeight="bold">
                    {analytics?.new_vip_members_30d || 0}
                  </Text>
                </BlockStack>
              </Grid.Cell>
            </Grid>
          </BlockStack>
        </Card>
      </BlockStack>
    </BlockStack>
  );
} 