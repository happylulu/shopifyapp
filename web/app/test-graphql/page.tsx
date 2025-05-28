"use client";

import React, { useState } from 'react';
import {
  Page,
  Layout,
  Card,
  BlockStack,
  InlineStack,
  TextField,
  Button,
  Banner,
  Text,
  Divider
} from '@shopify/polaris';
import { LoyaltyProfileTest } from '../../components/LoyaltyProfileTest';

export default function TestGraphQLPage() {
  const [customerId, setCustomerId] = useState('test-customer-123');
  const [shopDomain, setShopDomain] = useState('demo.myshopify.com');
  const [showTest, setShowTest] = useState(false);

  const handleRunTest = () => {
    if (customerId.trim()) {
      setShowTest(true);
    }
  };

  const handleReset = () => {
    setShowTest(false);
  };

  return (
    <Page
      title="GraphQL Client Test"
      subtitle="Test the type-safe GraphQL client setup"
      backAction={{ content: 'Back', url: '/' }}
    >
      <Layout>
        <Layout.Section>
          <Banner
            title="GraphQL Client Testing"
            tone="info"
          >
            <Text as="p">
              This page tests our type-safe GraphQL client setup with React Query hooks.
              Enter a customer ID to test the loyalty profile and rewards queries.
            </Text>
          </Banner>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h2">
                Test Configuration
              </Text>

              <BlockStack gap="200">
                <TextField
                  label="Customer ID"
                  value={customerId}
                  onChange={setCustomerId}
                  placeholder="e.g., test-customer-123"
                  helpText="Enter a customer ID to test with"
                />

                <TextField
                  label="Shop Domain"
                  value={shopDomain}
                  onChange={setShopDomain}
                  placeholder="e.g., demo.myshopify.com"
                  helpText="Shop domain for the GraphQL requests"
                />
              </BlockStack>

              <InlineStack align="end">
                <InlineStack gap="200">
                  {showTest && (
                    <Button onClick={handleReset}>
                      Reset
                    </Button>
                  )}
                  <Button
                    variant="primary"
                    onClick={handleRunTest}
                    disabled={!customerId.trim()}
                  >
                    {showTest ? 'Refresh Test' : 'Run Test'}
                  </Button>
                </InlineStack>
              </InlineStack>
            </BlockStack>
          </Card>
        </Layout.Section>

        {showTest && (
          <>
            <Layout.Section>
              <Divider />
            </Layout.Section>

            <Layout.Section>
              <LoyaltyProfileTest
                customerId={customerId}
                shopDomain={shopDomain}
              />
            </Layout.Section>
          </>
        )}

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h2">
                GraphQL Setup Checklist
              </Text>

              <BlockStack gap="200">
                <Text as="p">✅ TypeScript types generated from GraphQL schema</Text>
                <Text as="p">✅ Type-safe GraphQL client with graphql-request</Text>
                <Text as="p">✅ React Query hooks for data fetching</Text>
                <Text as="p">✅ Error boundary for graceful error handling</Text>
                <Text as="p">✅ GraphQL proxy route for backend communication</Text>
                <Text as="p">✅ Query provider with optimized defaults</Text>
                <Text as="p">✅ Development tools (React Query DevTools)</Text>
              </BlockStack>

              <Banner
                title="Next Steps"
                tone="success"
              >
                <BlockStack gap="200">
                  <Text as="p">
                    <strong>June 25:</strong> Build enhanced &quot;My Points&quot; component with real-time updates
                  </Text>
                  <Text as="p">
                    <strong>June 27:</strong> Create advanced rewards marketplace with filtering
                  </Text>
                  <Text as="p">
                    <strong>June 29:</strong> Implement production-ready redemption flow
                  </Text>
                  <Text as="p">
                    <strong>July 1:</strong> Deploy Shopify UI extensions with GraphQL
                  </Text>
                  <Text as="p">
                    <strong>July 4:</strong> End-to-end testing and monitoring setup
                  </Text>
                </BlockStack>
              </Banner>
            </BlockStack>
          </Card>
        </Layout.Section>

        {process.env.NODE_ENV === 'development' && (
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text variant="headingMd" as="h2">
                  Development Information
                </Text>

                <BlockStack gap="200">
                  <Text variant="bodySm" color="subdued">
                    GraphQL Endpoint: /api/loyalty-graphql
                  </Text>
                  <Text variant="bodySm" color="subdued">
                    Backend Server: http://localhost:8005/graphql
                  </Text>
                  <Text variant="bodySm" color="subdued">
                    Environment: {process.env.NODE_ENV}
                  </Text>
                  <Text variant="bodySm" color="subdued">
                    React Query DevTools: Available (bottom-right corner)
                  </Text>
                </BlockStack>
              </BlockStack>
            </Card>
          </Layout.Section>
        )}
      </Layout>
    </Page>
  );
}
