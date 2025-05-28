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
  Box,
  Select
} from '@shopify/polaris';

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = React.useState('30');
  const [refreshing, setRefreshing] = React.useState(false);

  const timeRangeOptions = [
    { label: 'Last 7 days', value: '7' },
    { label: 'Last 30 days', value: '30' },
    { label: 'Last 90 days', value: '90' },
    { label: 'Last 12 months', value: '365' },
  ];

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  // Mock analytics data
  const analyticsData = {
    overview: {
      totalRevenue: 45230.50,
      loyaltyRevenue: 12450.75,
      newMembers: 156,
      activeMembers: 892,
      pointsIssued: 45230,
      pointsRedeemed: 18920,
      redemptionRate: 41.8,
      averageOrderValue: 87.50,
      loyaltyAOV: 112.30,
      memberRetention: 68.5,
    },
    trends: {
      revenueGrowth: 12.3,
      memberGrowth: 8.7,
      engagementGrowth: 15.2,
    },
    topRewards: [
      { name: '10% Discount', redemptions: 45, revenue: 2250.00 },
      { name: 'Free Shipping', redemptions: 38, revenue: 1140.00 },
      { name: '$5 Store Credit', redemptions: 23, revenue: 1150.00 },
    ],
    memberActivity: [
      ['John Doe', 'Points Earned', '+150', 'Order #1001', '2 hours ago'],
      ['Jane Smith', 'Reward Redeemed', '-500', '10% Discount', '4 hours ago'],
      ['Bob Johnson', 'Tier Upgrade', '0', 'Upgraded to Gold', '6 hours ago'],
      ['Alice Brown', 'Points Earned', '+75', 'Order #1002', '8 hours ago'],
      ['Charlie Wilson', 'Reward Redeemed', '-200', 'Free Shipping', '1 day ago'],
    ],
  };

  return (
    <Page
      title="Loyalty Analytics"
      subtitle="Track your loyalty program performance and member engagement"
      primaryAction={{
        content: 'Refresh Data',
        onAction: handleRefresh,
        loading: refreshing,
      }}
      secondaryActions={[
        {
          content: 'Export Report',
          onAction: () => alert('Export functionality coming soon'),
        },
        {
          content: 'Schedule Report',
          onAction: () => alert('Scheduled reports coming soon'),
        },
      ]}
    >
      <Layout>
        {/* Time Range Selector */}
        <Layout.Section>
          <Card>
            <InlineStack align="space-between">
              <Text variant="headingMd" as="h3">Analytics Overview</Text>
              <Box width="200px">
                <Select
                  label="Time Range"
                  labelHidden
                  options={timeRangeOptions}
                  value={timeRange}
                  onChange={setTimeRange}
                />
              </Box>
            </InlineStack>
          </Card>
        </Layout.Section>

        {/* Key Metrics */}
        <Layout.Section>
          <InlineStack gap="400" wrap={false}>
            <Card>
              <BlockStack gap="200">
                <Text variant="headingMd" as="h3">Total Revenue</Text>
                <Text variant="heading2xl" as="p" tone="success">
                  ${analyticsData.overview.totalRevenue.toLocaleString()}
                </Text>
                <Text variant="bodySm" tone="subdued">
                  ${analyticsData.overview.loyaltyRevenue.toLocaleString()} from loyalty members
                </Text>
                <Badge tone="success">+{analyticsData.trends.revenueGrowth}% vs last period</Badge>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="200">
                <Text variant="headingMd" as="h3">Active Members</Text>
                <Text variant="heading2xl" as="p" tone="success">
                  {analyticsData.overview.activeMembers.toLocaleString()}
                </Text>
                <Text variant="bodySm" tone="subdued">
                  {analyticsData.overview.newMembers} new this period
                </Text>
                <Badge tone="success">+{analyticsData.trends.memberGrowth}% growth</Badge>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="200">
                <Text variant="headingMd" as="h3">Points Activity</Text>
                <Text variant="heading2xl" as="p" tone="success">
                  {analyticsData.overview.pointsIssued.toLocaleString()}
                </Text>
                <Text variant="bodySm" tone="subdued">
                  {analyticsData.overview.pointsRedeemed.toLocaleString()} redeemed ({analyticsData.overview.redemptionRate}%)
                </Text>
                <Badge tone="info">Healthy redemption rate</Badge>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="200">
                <Text variant="headingMd" as="h3">Avg Order Value</Text>
                <Text variant="heading2xl" as="p" tone="success">
                  ${analyticsData.overview.loyaltyAOV}
                </Text>
                <Text variant="bodySm" tone="subdued">
                  vs ${analyticsData.overview.averageOrderValue} non-loyalty
                </Text>
                <Badge tone="success">+28% higher AOV</Badge>
              </BlockStack>
            </Card>
          </InlineStack>
        </Layout.Section>

        {/* Performance Insights */}
        <Layout.Section>
          <Banner
            title="Performance Insights"
            tone="success"
          >
            <Text as="p">
              Your loyalty program is performing excellently! Member engagement is up {analyticsData.trends.engagementGrowth}% 
              and loyalty members have a {((analyticsData.overview.loyaltyAOV / analyticsData.overview.averageOrderValue - 1) * 100).toFixed(0)}% 
              higher average order value.
            </Text>
          </Banner>
        </Layout.Section>

        <Layout.Section>
          <InlineStack gap="400" align="start">
            {/* Top Performing Rewards */}
            <Box width="60%">
              <Card>
                <BlockStack gap="400">
                  <Text variant="headingMd" as="h3">Top Performing Rewards</Text>
                  
                  <BlockStack gap="300">
                    {analyticsData.topRewards.map((reward, index) => (
                      <Card key={reward.name} background="bg-surface-secondary">
                        <InlineStack align="space-between">
                          <BlockStack gap="100">
                            <InlineStack gap="200" blockAlign="center">
                              <Badge tone="info">#{index + 1}</Badge>
                              <Text variant="bodyMd" fontWeight="medium">
                                {reward.name}
                              </Text>
                            </InlineStack>
                            <Text variant="bodySm" tone="subdued">
                              {reward.redemptions} redemptions
                            </Text>
                          </BlockStack>
                          <Text variant="headingMd" as="p">
                            ${reward.revenue.toLocaleString()}
                          </Text>
                        </InlineStack>
                      </Card>
                    ))}
                  </BlockStack>
                </BlockStack>
              </Card>
            </Box>

            {/* Member Retention */}
            <Box width="40%">
              <Card>
                <BlockStack gap="400">
                  <Text variant="headingMd" as="h3">Member Retention</Text>
                  
                  <BlockStack gap="300">
                    <Box>
                      <InlineStack align="space-between">
                        <Text variant="bodyMd">Overall Retention</Text>
                        <Text variant="bodyMd" fontWeight="medium">
                          {analyticsData.overview.memberRetention}%
                        </Text>
                      </InlineStack>
                      <Box paddingBlockStart="100">
                        <ProgressBar 
                          progress={analyticsData.overview.memberRetention} 
                          size="small"
                        />
                      </Box>
                    </Box>

                    <Box>
                      <InlineStack align="space-between">
                        <Text variant="bodyMd">Redemption Rate</Text>
                        <Text variant="bodyMd" fontWeight="medium">
                          {analyticsData.overview.redemptionRate}%
                        </Text>
                      </InlineStack>
                      <Box paddingBlockStart="100">
                        <ProgressBar 
                          progress={analyticsData.overview.redemptionRate} 
                          size="small"
                        />
                      </Box>
                    </Box>

                    <Banner tone="info">
                      <Text as="p">
                        Strong retention indicates healthy program engagement.
                      </Text>
                    </Banner>
                  </BlockStack>
                </BlockStack>
              </Card>
            </Box>
          </InlineStack>
        </Layout.Section>

        {/* Recent Member Activity */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <InlineStack align="space-between">
                <Text variant="headingMd" as="h3">Recent Member Activity</Text>
                <Button
                  variant="plain"
                  onClick={() => alert('Full activity log coming soon')}
                >
                  View all activity
                </Button>
              </InlineStack>

              <DataTable
                columnContentTypes={['text', 'text', 'text', 'text', 'text']}
                headings={['Member', 'Activity', 'Points', 'Details', 'Time']}
                rows={analyticsData.memberActivity}
                truncate
              />
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Quick Actions */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h3">Analytics Actions</Text>
              
              <InlineStack gap="300">
                <Button onClick={() => alert('Member segmentation coming soon')}>
                  View Member Segments
                </Button>
                <Button onClick={() => alert('Cohort analysis coming soon')}>
                  Cohort Analysis
                </Button>
                <Button onClick={() => alert('Revenue attribution coming soon')}>
                  Revenue Attribution
                </Button>
                <Button url="/admin-working">
                  Back to Dashboard
                </Button>
              </InlineStack>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
