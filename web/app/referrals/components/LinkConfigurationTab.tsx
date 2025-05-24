"use client";

import React, { useState, useCallback } from 'react';
import {
  BlockStack,
  InlineStack,
  Text,
  TextField,
  Button,
  Card,
  Box,
  Checkbox,
  Select,
  Badge,
  Banner,
  Tabs,
  List,
  Link,
  Divider,
  Icon
} from '@shopify/polaris';
import {
  LinkIcon,
  ExternalIcon,
  InfoIcon,
  CheckIcon,
  ClipboardIcon
} from '@shopify/polaris-icons';

interface LinkConfigurationTabProps {
  config: any;
  onUpdate: (config: any) => void;
  loading: boolean;
}

interface URLPreviewProps {
  baseUrl: string;
  slug: string;
  customerName: string;
  utmEnabled: boolean;
}

const URLPreview: React.FC<URLPreviewProps> = ({ baseUrl, slug, customerName, utmEnabled }) => {
  const sampleUrl = `${baseUrl}/${slug.replace('[customer-first-name]', customerName)}${utmEnabled ? '?utm_source=referral&utm_medium=social&utm_campaign=friend_referral' : ''}`;
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(sampleUrl);
  };

  return (
    <Card background="bg-surface-secondary">
      <BlockStack gap="300">
        <Text as="h3" variant="headingSm">URL Preview</Text>
        <Box padding="300" background="bg-surface" borderRadius="200">
          <InlineStack align="space-between" gap="200">
            <Text as="p" variant="bodySm" fontFamily="mono" truncate>
              {sampleUrl}
            </Text>
            <Button 
              size="micro" 
              icon={ClipboardIcon} 
              onClick={copyToClipboard}
              accessibilityLabel="Copy URL"
            />
          </InlineStack>
        </Box>
        <Text as="p" variant="bodyXs" tone="subdued">
          Sample URL for customer "{customerName}"
        </Text>
      </BlockStack>
    </Card>
  );
};

const BestPracticesPanel: React.FC = () => (
  <BlockStack gap="400">
    <InlineStack gap="200" align="start">
      <Icon source={InfoIcon} tone="info" />
      <Text as="h3" variant="headingSm" tone="info">Referral Sharing Best Practices</Text>
    </InlineStack>
    
    <Text as="p" variant="bodySm">
      Keep referral messages short and compelling. Include a clear value proposition that emphasizes the benefit for both the referrer and their friend. Personalized messages typically increase conversion rates by up to 30%.
    </Text>

    <BlockStack gap="300">
      <Text as="h4" variant="headingXs">Key Tips:</Text>
      <List type="bullet">
        <List.Item>Use customers' first names in URLs for personalization</List.Item>
        <List.Item>Enable UTM parameters to track campaign performance</List.Item>
        <List.Item>Keep custom slugs short and memorable (e.g., "ref" or "invite")</List.Item>
        <List.Item>Test different URL formats to see what works best</List.Item>
        <List.Item>Consider using URL shorteners for social media sharing</List.Item>
      </List>
    </BlockStack>

    <Card background="bg-surface-warning">
      <BlockStack gap="200">
        <Text as="h4" variant="headingXs">⚡ Pro Tip</Text>
        <Text as="p" variant="bodyXs">
          URLs with customer names see 25% higher click-through rates compared to generic referral codes.
        </Text>
      </BlockStack>
    </Card>
  </BlockStack>
);

const CustomerFlowPanel: React.FC = () => (
  <BlockStack gap="400">
    <Text as="h3" variant="headingSm">Customer Referral Flow</Text>
    
    <BlockStack gap="300">
      <Card>
        <InlineStack gap="300" align="start">
          <Box>
            <div style={{ 
              width: '24px', 
              height: '24px', 
              borderRadius: '50%', 
              background: '#22c55e', 
              color: 'white', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontSize: '12px',
              fontWeight: 'bold'
            }}>1</div>
          </Box>
          <BlockStack gap="100">
            <Text as="h4" variant="headingXs">Customer gets referral link</Text>
            <Text as="p" variant="bodyXs" tone="subdued">
              After purchase or through email campaigns, customers receive their unique referral link
            </Text>
          </BlockStack>
        </InlineStack>
      </Card>

      <Card>
        <InlineStack gap="300" align="start">
          <Box>
            <div style={{ 
              width: '24px', 
              height: '24px', 
              borderRadius: '50%', 
              background: '#fb923c', 
              color: 'white', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontSize: '12px',
              fontWeight: 'bold'
            }}>2</div>
          </Box>
          <BlockStack gap="100">
            <Text as="h4" variant="headingXs">Share with friends</Text>
            <Text as="p" variant="bodyXs" tone="subdued">
              Customer shares personalized link via social media, email, or direct messaging
            </Text>
          </BlockStack>
        </InlineStack>
      </Card>

      <Card>
        <InlineStack gap="300" align="start">
          <Box>
            <div style={{ 
              width: '24px', 
              height: '24px', 
              borderRadius: '50%', 
              background: '#3b82f6', 
              color: 'white', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontSize: '12px',
              fontWeight: 'bold'
            }}>3</div>
          </Box>
          <BlockStack gap="100">
            <Text as="h4" variant="headingXs">Friend clicks and purchases</Text>
            <Text as="p" variant="bodyXs" tone="subdued">
              Friend visits your store through the referral link and makes a purchase
            </Text>
          </BlockStack>
        </InlineStack>
      </Card>

      <Card>
        <InlineStack gap="300" align="start">
          <Box>
            <div style={{ 
              width: '24px', 
              height: '24px', 
              borderRadius: '50%', 
              background: '#8b5cf6', 
              color: 'white', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontSize: '12px',
              fontWeight: 'bold'
            }}>4</div>
          </Box>
          <BlockStack gap="100">
            <Text as="h4" variant="headingXs">Both customers get rewards</Text>
            <Text as="p" variant="bodyXs" tone="subdued">
              Referrer gets points/discount, new customer gets welcome bonus
            </Text>
          </BlockStack>
        </InlineStack>
      </Card>
    </BlockStack>
  </BlockStack>
);

export const LinkConfigurationTab: React.FC<LinkConfigurationTabProps> = ({ 
  config, 
  onUpdate, 
  loading 
}) => {
  const [formData, setFormData] = useState({
    baseUrl: config?.base_url || 'yourstore.com',
    customSlug: config?.custom_slug || 'ref',
    useCustomerName: config?.use_customer_name ?? true,
    includeUtmParams: config?.include_utm_params ?? true,
    useUrlShortener: config?.use_url_shortener ?? false,
    shortenerService: config?.shortener_service || 'bitly',
    urlExpiration: config?.url_expiration || 'never',
  });

  const [selectedSubTab, setSelectedSubTab] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleInputChange = useCallback((field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSave = useCallback(async () => {
    try {
      // Here you would call your API to save the configuration
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      onUpdate(formData);
    } catch (error) {
      console.error('Failed to save configuration:', error);
    }
  }, [formData, onUpdate]);

  const urlPreviewBase = formData.baseUrl.startsWith('http') 
    ? formData.baseUrl 
    : `https://${formData.baseUrl}`;

  const urlPattern = formData.useCustomerName 
    ? `${formData.customSlug}/[customer-first-name]`
    : `${formData.customSlug}/[referral-code]`;

  const shortenerOptions = [
    { label: 'Bitly', value: 'bitly' },
    { label: 'TinyURL', value: 'tinyurl' },
    { label: 'Custom Domain', value: 'custom' },
  ];

  const expirationOptions = [
    { label: 'Never expire', value: 'never' },
    { label: '30 days', value: '30' },
    { label: '90 days', value: '90' },
    { label: '1 year', value: '365' },
  ];

  const subTabs = [
    { id: 'practices', content: 'Best Practices' },
    { id: 'flow', content: 'Customer Flow' },
  ];

  return (
    <BlockStack gap="500">
      {showSuccess && (
        <Banner title="Configuration saved successfully!" tone="success">
          <p>Your referral link settings have been updated.</p>
        </Banner>
      )}

      <InlineStack gap="600" align="start">
        {/* Left Column - Configuration */}
        <Box minWidth="500px">
          <BlockStack gap="500">
            {/* Header */}
            <BlockStack gap="200">
              <InlineStack gap="200" align="start">
                <Icon source={LinkIcon} tone="base" />
                <Text as="h2" variant="headingLg">Link Configuration</Text>
              </InlineStack>
              <Text as="p" variant="bodySm" tone="subdued">
                Configure referral links for social sharing
              </Text>
            </BlockStack>

            <Divider />

            {/* Custom URL Slug */}
            <Card>
              <BlockStack gap="400">
                <Text as="h3" variant="headingMd">Custom URL Slug</Text>
                
                <InlineStack gap="300" align="center">
                  <TextField
                    value={formData.baseUrl}
                    onChange={(value) => handleInputChange('baseUrl', value)}
                    label="Base URL"
                    autoComplete="url"
                    disabled
                    connectedLeft={
                      <Box padding="200" background="bg-surface-secondary">
                        <Text as="span" variant="bodySm" tone="subdued">https://</Text>
                      </Box>
                    }
                  />
                  <Text as="span" variant="bodySm">/</Text>
                  <TextField
                    value={formData.customSlug}
                    onChange={(value) => handleInputChange('customSlug', value)}
                    label="Custom slug"
                    autoComplete="off"
                    placeholder="ref"
                  />
                  <Text as="span" variant="bodySm">/</Text>
                  <Badge tone="info">[customer-first-name]</Badge>
                </InlineStack>

                <Text as="p" variant="bodyXs" tone="subdued">
                  Customize how your referral links appear when shared
                </Text>
              </BlockStack>
            </Card>

            {/* URL Preview */}
            <URLPreview
              baseUrl={urlPreviewBase}
              slug={urlPattern}
              customerName="sarah"
              utmEnabled={formData.includeUtmParams}
            />

            {/* Advanced Options */}
            <Card>
              <BlockStack gap="400">
                <Text as="h3" variant="headingMd">Advanced Options</Text>
                
                <Checkbox
                  label="Include UTM Parameters"
                  helpText="Add tracking parameters to measure campaign success"
                  checked={formData.includeUtmParams}
                  onChange={(checked) => handleInputChange('includeUtmParams', checked)}
                />

                <Checkbox
                  label="Use URL Shortener"
                  helpText="Create more shareable shortened links"
                  checked={formData.useUrlShortener}
                  onChange={(checked) => handleInputChange('useUrlShortener', checked)}
                />

                {formData.useUrlShortener && (
                  <Box paddingInlineStart="600">
                    <Select
                      label="Shortener Service"
                      options={shortenerOptions}
                      value={formData.shortenerService}
                      onChange={(value) => handleInputChange('shortenerService', value)}
                    />
                  </Box>
                )}

                <Select
                  label="Link Expiration"
                  options={expirationOptions}
                  value={formData.urlExpiration}
                  onChange={(value) => handleInputChange('urlExpiration', value)}
                  helpText="Set when referral links should expire"
                />
              </BlockStack>
            </Card>

            {/* Save Button */}
            <InlineStack align="end">
              <Button
                variant="primary"
                onClick={handleSave}
                loading={loading}
                size="large"
              >
                Save Configuration
              </Button>
            </InlineStack>
          </BlockStack>
        </Box>

        {/* Right Column - Best Practices & Customer Flow */}
        <Box minWidth="400px">
          <Card>
            <Tabs
              tabs={subTabs}
              selected={selectedSubTab}
              onSelect={setSelectedSubTab}
            >
              <Box paddingBlockStart="400">
                {selectedSubTab === 0 && <BestPracticesPanel />}
                {selectedSubTab === 1 && <CustomerFlowPanel />}
              </Box>
            </Tabs>
          </Card>
        </Box>
      </InlineStack>
    </BlockStack>
  );
}; 