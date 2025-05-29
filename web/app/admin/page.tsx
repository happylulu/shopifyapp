"use client";

import React from 'react';
import {
  Page,
  Layout,
  Card,
  BlockStack,
  InlineStack,
  Text,
  Badge,
  Button,
  Banner,
  ProgressBar,
  DataTable,
  Divider,
  Box
} from '@shopify/polaris';

import { useAdmin } from './layout';
import { TokenTester } from '../components/TokenTester';

// Mock data - replace with real API calls
const mockDashboardData = {
  overview: {
    totalMembers: 1247,
    activeMembers: 892,
    pointsIssued: 45230,
    rewardsRedeemed: 156,
    conversionRate: 12.5,
    averageOrderValue: 87.50,
  },
  recentActivity: [
    {
      id: '1',
      type: 'points_earned',
      customer: 'John Doe',
      points: 150,
      reason: 'Order #1001',
      timestamp: '2 hours ago',
    },
    {
      id: '2',
      type: 'reward_redeemed',
      customer: 'Jane Smith',
      points: -500,
      reason: '10% Discount',
      timestamp: '4 hours ago',
    },
    {
      id: '3',
      type: 'tier_upgrade',
      customer: 'Bob Johnson',
      points: 0,
      reason: 'Upgraded to Gold',
      timestamp: '6 hours ago',
    },
  ],
  topRewards: [
    { name: '10% Discount', redemptions: 45, pointsCost: 500 },
    { name: 'Free Shipping', redemptions: 38, pointsCost: 200 },
    { name: '$5 Store Credit', redemptions: 23, pointsCost: 1000 },
  ],
  tierDistribution: [
    { tier: 'Bronze', members: 623, percentage: 50 },
    { tier: 'Silver', members: 374, percentage: 30 },
    { tier: 'Gold', members: 187, percentage: 15 },
    { tier: 'Platinum', members: 63, percentage: 5 },
  ],
};

export default function AdminDashboard() {
  const { showToast, setLoading } = useAdmin();
  const [refreshing, setRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
    showToast('Dashboard data refreshed');
  };

  const activityRows = mockDashboardData.recentActivity.map((activity) => [
    activity.customer,
    <Badge
      key={activity.id}
      tone={
        activity.type === 'points_earned' ? 'success' :
        activity.type === 'reward_redeemed' ? 'attention' :
        'info'
      }
    >
      {activity.type.replace('_', ' ')}
    </Badge>,
    activity.points > 0 ? `+${activity.points}` : activity.points.toString(),
    activity.reason,
    activity.timestamp,
  ]);

  return (
    <Page
      title="Loyalty Program Dashboard"
      subtitle="Overview of your loyalty program performance"
      primaryAction={{
        content: 'Refresh Data',
        onAction: handleRefresh,
        loading: refreshing,
      }}
      secondaryActions={[
        {
          content: 'Export Report',
          onAction: () => showToast('Export feature coming soon'),
        },
        {
          content: 'Program Settings',
          url: '/admin/settings',
        },
      ]}
    >
      <Layout>
        {/* Quick Stats */}
        <Layout.Section>
          <InlineStack gap="400" wrap={false}>
            <Card>
              <BlockStack gap="200">
                <Text variant="headingMd" as="h3">Total Members</Text>
                <Text variant="heading2xl" as="p" tone="success">
                  {mockDashboardData.overview.totalMembers.toLocaleString()}
                </Text>
                <Text variant="bodySm" tone="subdued">
                  {mockDashboardData.overview.activeMembers} active this month
                </Text>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="200">
                <Text variant="headingMd" as="h3">Points Issued</Text>
                <Text variant="heading2xl" as="p" tone="success">
                  {mockDashboardData.overview.pointsIssued.toLocaleString()}
                </Text>
                <Text variant="bodySm" tone="subdued">
                  {mockDashboardData.overview.rewardsRedeemed} rewards redeemed
                </Text>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="200">
                <Text variant="headingMd" as="h3">Conversion Rate</Text>
                <Text variant="heading2xl" as="p" tone="success">
                  {mockDashboardData.overview.conversionRate}%
                </Text>
                <Text variant="bodySm" tone="subdued">
                  Loyalty member conversion
                </Text>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="200">
                <Text variant="headingMd" as="h3">Avg Order Value</Text>
                <Text variant="heading2xl" as="p" tone="success">
                  ${mockDashboardData.overview.averageOrderValue}
                </Text>
                <Text variant="bodySm" tone="subdued">
                  From loyalty members
                </Text>
              </BlockStack>
            </Card>
          </InlineStack>
        </Layout.Section>

        {/* Authentication Testing */}
        <Layout.Section>
          <TokenTester />
        </Layout.Section>

        {/* Program Health Banner */}
        <Layout.Section>
          <Banner
            title="Program Performance"
            tone="success"
          >
            <Text as="p">
              Your loyalty program is performing well! Member engagement is up 15%
              this month and reward redemptions are increasing.
            </Text>
          </Banner>
        </Layout.Section>

        <Layout.Section>
          <InlineStack gap="400" align="start">
            {/* Recent Activity */}
            <Box width="60%">
              <Card>
                <BlockStack gap="400">
                  <InlineStack align="space-between">
                    <Text variant="headingMd" as="h3">Recent Activity</Text>
                    <Button
                      variant="plain"
                      url="/admin/transactions"
                    >
                      View all
                    </Button>
                  </InlineStack>

                  <DataTable
                    columnContentTypes={['text', 'text', 'text', 'text', 'text']}
                    headings={['Customer', 'Type', 'Points', 'Reason', 'Time']}
                    rows={activityRows}
                    truncate
                  />
                </BlockStack>
              </Card>
            </Box>

            {/* Tier Distribution */}
            <Box width="40%">
              <Card>
                <BlockStack gap="400">
                  <Text variant="headingMd" as="h3">Tier Distribution</Text>

                  <BlockStack gap="300">
                    {mockDashboardData.tierDistribution.map((tier) => (
                      <div key={tier.tier}>
                        <InlineStack align="space-between">
                          <Text variant="bodyMd" fontWeight="medium">
                            {tier.tier}
                          </Text>
                          <Text variant="bodySm" tone="subdued">
                            {tier.members} members ({tier.percentage}%)
                          </Text>
                        </InlineStack>
                        <Box paddingBlockStart="100">
                          <ProgressBar
                            progress={tier.percentage}
                            size="small"
                          />
                        </Box>
                      </div>
                    ))}
                  </BlockStack>

                  <Divider />

                  <Button
                    variant="plain"
                    url="/admin/tiers"
                    textAlign="left"
                  >
                    Manage Tiers
                  </Button>
                </BlockStack>
              </Card>
            </Box>
          </InlineStack>
        </Layout.Section>

        {/* Top Rewards */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <InlineStack align="space-between">
                <Text variant="headingMd" as="h3">Top Performing Rewards</Text>
                <Button
                  variant="plain"
                  url="/admin/rewards"
                >
                  Manage Rewards
                </Button>
              </InlineStack>

              <InlineStack gap="400">
                {mockDashboardData.topRewards.map((reward, index) => (
                  <Card key={reward.name} background="bg-surface-secondary">
                    <BlockStack gap="200">
                      <InlineStack align="space-between">
                        <Text variant="bodyMd" fontWeight="medium">
                          {reward.name}
                        </Text>
                        <Badge tone="info">#{index + 1}</Badge>
                      </InlineStack>

                      <Text variant="bodySm" tone="subdued">
                        {reward.redemptions} redemptions
                      </Text>

                      <Text variant="bodySm">
                        {reward.pointsCost} points
                      </Text>
                    </BlockStack>
                  </Card>
                ))}
              </InlineStack>
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Quick Actions */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h3">Quick Actions</Text>

              <InlineStack gap="300">
                <Button url="/admin/rewards" variant="primary">
                  Create New Reward
                </Button>
                <Button url="/admin/tiers">
                  Configure Tiers
                </Button>
                <Button url="/admin/customers">
                  Lookup Customer
                </Button>
                <Button url="/admin/analytics">
                  View Analytics
                </Button>
              </InlineStack>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
