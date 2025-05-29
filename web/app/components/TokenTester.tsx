"use client";

import { useState, useEffect } from 'react';
import { Card, Button, Text, Box, InlineStack, BlockStack, Banner } from '@shopify/polaris';

interface TestResult {
  success: boolean;
  data?: any;
  error?: string;
  timestamp: string;
}

export function TokenTester() {
  const [isEmbedded, setIsEmbedded] = useState(false);
  const [token, setToken] = useState<string>('');
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(false);

  // Check if we're running inside Shopify Admin
  useEffect(() => {
    // Check for Shopify context
    const urlParams = new URLSearchParams(window.location.search);
    const hasShopifyParams = urlParams.has('shop') || urlParams.has('host');
    const hasShopifyGlobal = typeof window !== 'undefined' && 'shopify' in window;

    setIsEmbedded(hasShopifyParams || hasShopifyGlobal);
  }, []);

  const getAppBridgeToken = async () => {
    if (!isEmbedded) {
      addTestResult({
        success: false,
        error: 'Not running in Shopify Admin. Use "shopify app dev" and open the app from your test store.',
        timestamp: new Date().toISOString()
      });
      return null;
    }

    try {
      // Dynamically import App Bridge to avoid SSR issues
      const { useAppBridge } = await import('@shopify/app-bridge-react');

      addTestResult({
        success: false,
        error: 'App Bridge token retrieval requires the app to be properly embedded. Please use "shopify app dev".',
        timestamp: new Date().toISOString()
      });
      return null;
    } catch (error) {
      console.error('Failed to get App Bridge token:', error);
      addTestResult({
        success: false,
        error: error instanceof Error ? error.message : 'App Bridge not available',
        timestamp: new Date().toISOString()
      });
      return null;
    }
  };

  const testFastAPIEndpoint = async (endpoint: string, useToken: boolean = true) => {
    setLoading(true);
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      if (useToken) {
        const currentToken = token || await getAppBridgeToken();
        if (!currentToken) {
          throw new Error('No token available');
        }
        headers['Authorization'] = `Bearer ${currentToken}`;
      }

      const response = await fetch(`http://127.0.0.1:8005${endpoint}`, {
        headers
      });

      const data = await response.json();

      addTestResult({
        success: response.ok,
        data: { endpoint, status: response.status, response: data },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      addTestResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  const addTestResult = (result: TestResult) => {
    setTestResults(prev => [result, ...prev.slice(0, 9)]); // Keep last 10 results
  };

  const copyTokenToClipboard = () => {
    if (token) {
      navigator.clipboard.writeText(token);
      addTestResult({
        success: true,
        data: { message: 'Token copied to clipboard' },
        timestamp: new Date().toISOString()
      });
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <Card>
      <BlockStack gap="400">
        <Text variant="headingMd" as="h2">
          🧪 Authentication Token Tester
        </Text>

        {!isEmbedded && (
          <Banner tone="info">
            <Text variant="bodyMd">
              <strong>Standalone Mode:</strong> You're viewing this outside of Shopify Admin.
              To test App Bridge tokens, run <code>shopify app dev</code> and open the app from your test store.
              You can still test the FastAPI endpoints directly.
            </Text>
          </Banner>
        )}

        <Text variant="bodyMd" color="subdued">
          Test the multi-tenant authentication system between your Next.js app and FastAPI backend.
        </Text>

        <InlineStack gap="200">
          <Button onClick={getAppBridgeToken} loading={loading}>
            Get App Bridge Token
          </Button>

          {token && (
            <Button onClick={copyTokenToClipboard} variant="secondary">
              Copy Token
            </Button>
          )}

          <Button onClick={clearResults} variant="secondary">
            Clear Results
          </Button>
        </InlineStack>

        {token && (
          <Box padding="300" background="bg-surface-secondary" borderRadius="200">
            <Text variant="bodyMd" fontWeight="bold">Token Preview:</Text>
            <Text variant="bodyMd" fontFamily="mono">
              {token.substring(0, 100)}...
            </Text>
          </Box>
        )}

        <Text variant="headingMd" as="h3">
          FastAPI Endpoint Tests
        </Text>

        <InlineStack gap="200" wrap>
          <Button
            onClick={() => testFastAPIEndpoint('/')}
            loading={loading}
            variant="secondary"
          >
            Test Health Check
          </Button>

          <Button
            onClick={() => testFastAPIEndpoint('/shop/info')}
            loading={loading}
            variant="primary"
          >
            Test Shop Info (Auth)
          </Button>

          <Button
            onClick={() => testFastAPIEndpoint('/shop/context')}
            loading={loading}
            variant="primary"
          >
            Test Shop Context
          </Button>

          <Button
            onClick={() => testFastAPIEndpoint('/session/list', false)}
            loading={loading}
            variant="secondary"
          >
            List Sessions
          </Button>
        </InlineStack>

        {testResults.length > 0 && (
          <Box>
            <Text variant="headingMd" as="h3">
              Test Results
            </Text>

            <BlockStack gap="200">
              {testResults.map((result, index) => (
                <Box
                  key={index}
                  padding="300"
                  background={result.success ? "bg-surface-success" : "bg-surface-critical"}
                  borderRadius="200"
                >
                  <BlockStack gap="100">
                    <InlineStack gap="200" align="space-between">
                      <Text variant="bodyMd" fontWeight="bold">
                        {result.success ? '✅ Success' : '❌ Error'}
                      </Text>
                      <Text variant="bodySm" color="subdued">
                        {new Date(result.timestamp).toLocaleTimeString()}
                      </Text>
                    </InlineStack>

                    {result.error && (
                      <Text variant="bodyMd" color="critical">
                        {result.error}
                      </Text>
                    )}

                    {result.data && (
                      <Box>
                        <Text variant="bodyMd" fontFamily="mono">
                          {JSON.stringify(result.data, null, 2)}
                        </Text>
                      </Box>
                    )}
                  </BlockStack>
                </Box>
              ))}
            </BlockStack>
          </Box>
        )}

        <Box padding="300" background="bg-surface-secondary" borderRadius="200">
          <BlockStack gap="200">
            <Text variant="headingMd" as="h3">
              Manual Testing Commands
            </Text>

            <Text variant="bodyMd">
              Copy the token above and use these curl commands:
            </Text>

            <Box>
              <Text variant="bodyMd" fontFamily="mono">
                # Test with App Bridge token
                <br />
                curl -H "Authorization: Bearer YOUR_TOKEN" \
                <br />
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;http://127.0.0.1:8005/shop/info
              </Text>
            </Box>

            <Box>
              <Text variant="bodyMd" fontFamily="mono">
                # Test without authentication
                <br />
                curl http://127.0.0.1:8005/session/list
              </Text>
            </Box>
          </BlockStack>
        </Box>
      </BlockStack>
    </Card>
  );
}
