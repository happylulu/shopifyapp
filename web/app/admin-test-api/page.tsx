"use client";

import React from 'react';
import { 
  Page, 
  Layout, 
  Card, 
  BlockStack,
  Text, 
  Button,
  Banner,
  Spinner
} from '@shopify/polaris';
import { useQuery } from '@tanstack/react-query';

// Simple test hook to verify React Query is working
function useTestQuery() {
  return useQuery({
    queryKey: ['test'],
    queryFn: async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      return {
        message: 'React Query is working!',
        timestamp: new Date().toISOString(),
      };
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export default function AdminTestApiPage() {
  const { data, isLoading, error, refetch } = useTestQuery();

  if (isLoading) {
    return (
      <Page title="Testing React Query...">
        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="400" align="center">
                <Spinner size="large" />
                <Text variant="bodyMd">Testing React Query integration...</Text>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  if (error) {
    return (
      <Page title="React Query Test Error">
        <Layout>
          <Layout.Section>
            <Banner tone="critical">
              <Text as="p">
                React Query test failed: {(error as Error).message}
              </Text>
            </Banner>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  return (
    <Page
      title="🧪 React Query Test"
      subtitle="Testing React Query integration"
      primaryAction={{
        content: 'Refetch Data',
        onAction: () => refetch(),
      }}
    >
      <Layout>
        <Layout.Section>
          <Banner
            title="✅ React Query Working!"
            tone="success"
          >
            <Text as="p">
              React Query is properly configured and working.
            </Text>
          </Banner>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h3">Test Results</Text>
              
              <Text as="p">
                <strong>Message:</strong> {data?.message}
              </Text>
              
              <Text as="p">
                <strong>Timestamp:</strong> {data?.timestamp}
              </Text>
              
              <Text as="p">
                <strong>Status:</strong> Data loaded successfully via React Query
              </Text>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h3">Next Steps</Text>
              
              <Text as="p">
                Since React Query is working, the issue with admin-working page is likely:
              </Text>
              
              <Text as="p">
                1. Import path issue with the admin API hooks<br/>
                2. Admin API client configuration<br/>
                3. CORS or network connectivity issue
              </Text>
              
              <Button url="/admin-working">
                Test Admin Working Page
              </Button>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
