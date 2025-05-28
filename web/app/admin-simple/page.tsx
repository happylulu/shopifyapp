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

export default function SimpleAdminPage() {
  const [count, setCount] = React.useState(0);

  return (
    <Page
      title="Simple Admin Dashboard"
      subtitle="Testing admin interface"
      primaryAction={{
        content: 'Refresh',
        onAction: () => setCount(c => c + 1),
      }}
    >
      <Layout>
        <Layout.Section>
          <Banner
            title="Admin Interface Test"
            tone="success"
          >
            <Text as="p">
              This is a simple admin page to test if the routing and components work.
              Click count: {count}
            </Text>
          </Banner>
        </Layout.Section>

        <Layout.Section>
          <InlineStack gap="400" wrap={false}>
            <Card>
              <BlockStack gap="200">
                <Text variant="headingMd" as="h3">Total Members</Text>
                <Text variant="heading2xl" as="p" tone="success">
                  1,247
                </Text>
                <Text variant="bodySm" tone="subdued">
                  892 active this month
                </Text>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="200">
                <Text variant="headingMd" as="h3">Points Issued</Text>
                <Text variant="heading2xl" as="p" tone="success">
                  45,230
                </Text>
                <Text variant="bodySm" tone="subdued">
                  156 rewards redeemed
                </Text>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="200">
                <Text variant="headingMd" as="h3">Conversion Rate</Text>
                <Text variant="heading2xl" as="p" tone="success">
                  12.5%
                </Text>
                <Text variant="bodySm" tone="subdued">
                  Loyalty member conversion
                </Text>
              </BlockStack>
            </Card>
          </InlineStack>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h3">Quick Actions</Text>
              
              <InlineStack gap="300">
                <Button variant="primary" onClick={() => alert('Create Reward clicked')}>
                  Create New Reward
                </Button>
                <Button onClick={() => alert('Configure Tiers clicked')}>
                  Configure Tiers
                </Button>
                <Button onClick={() => alert('Lookup Customer clicked')}>
                  Lookup Customer
                </Button>
                <Button onClick={() => alert('View Analytics clicked')}>
                  View Analytics
                </Button>
              </InlineStack>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h3">Navigation Test</Text>
              
              <InlineStack gap="300">
                <Button url="/admin">
                  Go to Full Admin
                </Button>
                <Button url="/admin-test">
                  Go to Admin Test
                </Button>
                <Button url="/">
                  Go to Home
                </Button>
              </InlineStack>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
