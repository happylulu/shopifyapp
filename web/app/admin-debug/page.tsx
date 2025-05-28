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
  Banner
} from '@shopify/polaris';

export default function AdminDebugPage() {
  const [count, setCount] = React.useState(0);

  // Mock data for testing
  const displayData = {
    total_members: 1247,
    active_members: 892,
    points_issued: 45230,
    rewards_redeemed: 156,
    conversion_rate: 12.5,
    average_order_value: 87.50,
  };

  const handleRefresh = () => {
    setCount(c => c + 1);
  };

  return (
    <Page
      title="🔧 Debug Admin Dashboard"
      subtitle="Testing admin interface without API calls"
      primaryAction={{
        content: 'Refresh Data',
        onAction: handleRefresh,
      }}
      secondaryActions={[
        {
          content: 'Export Report',
          onAction: () => alert('Export feature coming soon'),
        },
        {
          content: 'Settings',
          onAction: () => alert('Settings clicked'),
        },
      ]}
    >
      <Layout>
        <Layout.Section>
          <Banner
            title="🔧 Debug Mode - Admin Interface"
            tone="info"
          >
            <Text as="p">
              This is a debug version without API calls to test the interface.
              Refresh count: {count} | Status: Debug Mode ✅
            </Text>
          </Banner>
        </Layout.Section>

        {/* Quick Stats */}
        <Layout.Section>
          <InlineStack gap="400" wrap={false}>
            <Card>
              <BlockStack gap="200">
                <Text variant="headingMd" as="h3">Total Members</Text>
                <Text variant="heading2xl" as="p" tone="success">
                  {displayData.total_members.toLocaleString()}
                </Text>
                <Text variant="bodySm" tone="subdued">
                  {displayData.active_members.toLocaleString()} active this month
                </Text>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="200">
                <Text variant="headingMd" as="h3">Points Issued</Text>
                <Text variant="heading2xl" as="p" tone="success">
                  {displayData.points_issued.toLocaleString()}
                </Text>
                <Text variant="bodySm" tone="subdued">
                  {displayData.rewards_redeemed.toLocaleString()} rewards redeemed
                </Text>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="200">
                <Text variant="headingMd" as="h3">Conversion Rate</Text>
                <Text variant="heading2xl" as="p" tone="success">
                  {displayData.conversion_rate.toFixed(1)}%
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
                  ${displayData.average_order_value.toFixed(2)}
                </Text>
                <Text variant="bodySm" tone="subdued">
                  From loyalty members
                </Text>
              </BlockStack>
            </Card>
          </InlineStack>
        </Layout.Section>

        {/* Quick Actions */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h3">Quick Actions</Text>
              
              <InlineStack gap="300">
                <Button variant="primary" onClick={() => alert('Create Reward clicked')}>
                  Create New Reward
                </Button>
                <Button url="/admin/tiers-simple">
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

        {/* Navigation Test */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h3">Navigation</Text>
              
              <InlineStack gap="300">
                <Button url="/admin-debug">
                  Refresh This Page
                </Button>
                <Button url="/admin-working">
                  Try Admin Working
                </Button>
                <Button url="/admin-simple">
                  Simple Admin
                </Button>
                <Button url="/">
                  Home
                </Button>
              </InlineStack>
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Debug Info */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h3">🔧 Debug Information</Text>
              
              <Text as="p">
                <strong>Purpose:</strong> This page tests the admin interface without API dependencies.
              </Text>
              
              <Text as="p">
                <strong>Status:</strong> If you can see this page, the basic admin interface is working.
              </Text>
              
              <Text as="p">
                <strong>Next Steps:</strong> Debug the API integration in the admin-working page.
              </Text>
              
              <InlineStack gap="300">
                <Button onClick={() => console.log('Console test')}>
                  Test Console Log
                </Button>
                <Button onClick={() => alert('Alert test')}>
                  Test Alert
                </Button>
                <Button onClick={() => setCount(c => c + 10)}>
                  Add 10 to Counter
                </Button>
              </InlineStack>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
