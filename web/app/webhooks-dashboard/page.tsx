"use client";

import React, { useState } from 'react';
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
  DataTable,
  Select,
  TextField
} from '@shopify/polaris';
import { testWebhook, testPayloads, runWebhookTests } from '../../lib/webhooks/test-webhooks';

export default function WebhooksDashboardPage() {
  const [selectedWebhook, setSelectedWebhook] = useState('orders/paid');
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [shopDomain, setShopDomain] = useState('test-shop.myshopify.com');

  const webhookOptions = [
    { label: 'Orders/Paid', value: 'orders/paid' },
    { label: 'Refunds/Create', value: 'refunds/create' },
    { label: 'Customers/Create', value: 'customers/create' },
    { label: 'Customers/Redact', value: 'customers/redact' },
    { label: 'Customers/Data Request', value: 'customers/data_request' },
    { label: 'Shop/Redact', value: 'shop/redact' },
    { label: 'App/Uninstalled', value: 'app/uninstalled' },
  ];

  const webhookStatus = [
    { webhook: 'orders/paid', status: 'active', description: 'Awards loyalty points for paid orders' },
    { webhook: 'refunds/create', status: 'active', description: 'Deducts points for refunds' },
    { webhook: 'customers/create', status: 'active', description: 'Creates initial loyalty profiles' },
    { webhook: 'customers/redact', status: 'active', description: 'GDPR customer data deletion' },
    { webhook: 'customers/data_request', status: 'active', description: 'GDPR customer data export' },
    { webhook: 'shop/redact', status: 'active', description: 'GDPR shop data deletion' },
    { webhook: 'app/uninstalled', status: 'active', description: 'App uninstallation cleanup' },
  ];

  const handleTestSingleWebhook = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/webhooks/${selectedWebhook.replace('/', '/')}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Topic': selectedWebhook,
          'X-Shopify-Hmac-Sha256': 'test-signature',
          'X-Shopify-Shop-Domain': shopDomain,
          'X-Shopify-Webhook-Id': `test-${Date.now()}`,
          'X-Shopify-Api-Version': '2025-04',
        },
        body: JSON.stringify(testPayloads[selectedWebhook as keyof typeof testPayloads]),
      });

      const result = await response.json();
      
      setTestResults(prev => [{
        webhook: selectedWebhook,
        status: response.ok ? 'success' : 'error',
        message: result.message,
        timestamp: new Date().toLocaleString(),
        data: result.data,
      }, ...prev.slice(0, 9)]); // Keep last 10 results

    } catch (error) {
      setTestResults(prev => [{
        webhook: selectedWebhook,
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toLocaleString(),
        data: null,
      }, ...prev.slice(0, 9)]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestAllWebhooks = async () => {
    setIsLoading(true);
    try {
      // Test all webhooks sequentially
      for (const option of webhookOptions) {
        const response = await fetch(`/api/webhooks/${option.value.replace('/', '/')}/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Topic': option.value,
            'X-Shopify-Hmac-Sha256': 'test-signature',
            'X-Shopify-Shop-Domain': shopDomain,
            'X-Shopify-Webhook-Id': `test-${Date.now()}`,
            'X-Shopify-Api-Version': '2025-04',
          },
          body: JSON.stringify(testPayloads[option.value as keyof typeof testPayloads]),
        });

        const result = await response.json();
        
        setTestResults(prev => [{
          webhook: option.value,
          status: response.ok ? 'success' : 'error',
          message: result.message,
          timestamp: new Date().toLocaleString(),
          data: result.data,
        }, ...prev]);
      }
    } catch (error) {
      console.error('Error testing all webhooks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const statusRows = webhookStatus.map((item) => [
    item.webhook,
    <Badge key={item.webhook} tone={item.status === 'active' ? 'success' : 'critical'}>
      {item.status}
    </Badge>,
    item.description,
    <Button
      key={`test-${item.webhook}`}
      size="slim"
      onClick={() => {
        setSelectedWebhook(item.webhook);
        handleTestSingleWebhook();
      }}
    >
      Test
    </Button>,
  ]);

  const resultRows = testResults.map((result, index) => [
    result.webhook,
    <Badge key={index} tone={result.status === 'success' ? 'success' : 'critical'}>
      {result.status}
    </Badge>,
    result.message,
    result.timestamp,
  ]);

  return (
    <Page
      title="Webhooks Dashboard"
      subtitle="Monitor and test Shopify webhook handlers"
      backAction={{ content: 'Back', url: '/' }}
    >
      <Layout>
        <Layout.Section>
          <Banner
            title="Webhook System Status"
            tone="info"
          >
            <Text as="p">
              All webhook handlers are configured and ready to process Shopify events.
              Use this dashboard to test webhook functionality and monitor processing.
            </Text>
          </Banner>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h2">
                Webhook Status
              </Text>
              
              <DataTable
                columnContentTypes={['text', 'text', 'text', 'text']}
                headings={['Webhook', 'Status', 'Description', 'Action']}
                rows={statusRows}
              />
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h2">
                Test Webhooks
              </Text>

              <InlineStack gap="400" align="start">
                <div style={{ minWidth: '200px' }}>
                  <Select
                    label="Select Webhook"
                    options={webhookOptions}
                    value={selectedWebhook}
                    onChange={setSelectedWebhook}
                  />
                </div>
                
                <div style={{ minWidth: '250px' }}>
                  <TextField
                    label="Shop Domain"
                    value={shopDomain}
                    onChange={setShopDomain}
                    placeholder="test-shop.myshopify.com"
                  />
                </div>
              </InlineStack>

              <InlineStack gap="200">
                <Button
                  variant="primary"
                  onClick={handleTestSingleWebhook}
                  loading={isLoading}
                >
                  Test Selected Webhook
                </Button>
                
                <Button
                  onClick={handleTestAllWebhooks}
                  loading={isLoading}
                >
                  Test All Webhooks
                </Button>
              </InlineStack>
            </BlockStack>
          </Card>
        </Layout.Section>

        {testResults.length > 0 && (
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text variant="headingMd" as="h2">
                  Test Results
                </Text>
                
                <DataTable
                  columnContentTypes={['text', 'text', 'text', 'text']}
                  headings={['Webhook', 'Status', 'Message', 'Timestamp']}
                  rows={resultRows}
                />
              </BlockStack>
            </Card>
          </Layout.Section>
        )}

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h2">
                Webhook Configuration
              </Text>

              <BlockStack gap="200">
                <Text as="p">
                  <strong>Configured Webhooks:</strong>
                </Text>
                <Text as="p">• orders/paid → /api/webhooks/orders/paid</Text>
                <Text as="p">• refunds/create → /api/webhooks/refunds/create</Text>
                <Text as="p">• customers/create → /api/webhooks/customers/create</Text>
                <Text as="p">• customers/redact → /api/webhooks/customers/redact</Text>
                <Text as="p">• customers/data_request → /api/webhooks/customers/data_request</Text>
                <Text as="p">• shop/redact → /api/webhooks/shop/redact</Text>
                <Text as="p">• app/uninstalled → /api/webhooks/app/uninstalled</Text>
              </BlockStack>

              <Banner
                title="Deployment Instructions"
                tone="warning"
              >
                <BlockStack gap="200">
                  <Text as="p">
                    To deploy webhook subscriptions to your Shopify app:
                  </Text>
                  <Text as="p">
                    1. Run <code>shopify app deploy</code> to apply webhook configurations
                  </Text>
                  <Text as="p">
                    2. Verify webhooks appear in Partner Dashboard under your app&apos;s settings
                  </Text>
                  <Text as="p">
                    3. Set SHOPIFY_WEBHOOK_SECRET environment variable
                  </Text>
                  <Text as="p">
                    4. Test with real Shopify events using <code>shopify app webhook trigger</code>
                  </Text>
                </BlockStack>
              </Banner>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
