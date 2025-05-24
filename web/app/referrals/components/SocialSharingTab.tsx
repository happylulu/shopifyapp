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
  Divider,
  Icon,
  Grid,
  Thumbnail
} from '@shopify/polaris';
import {
  ShareIcon,
  EmailIcon,
  SocialPostIcon,
  ImageIcon,
  EditIcon
} from '@shopify/polaris-icons';

interface SocialSharingTabProps {
  config: any;
  onUpdate: (config: any) => void;
  loading: boolean;
}

interface PlatformConfigProps {
  platform: string;
  icon: string;
  enabled: boolean;
  message: string;
  onToggle: (enabled: boolean) => void;
  onMessageChange: (message: string) => void;
  characterLimit: number;
  color: string;
}

const PlatformConfig: React.FC<PlatformConfigProps> = ({
  platform,
  icon,
  enabled,
  message,
  onToggle,
  onMessageChange,
  characterLimit,
  color
}) => {
  const [charCount, setCharCount] = useState(message.length);

  const handleMessageChange = (value: string) => {
    setCharCount(value.length);
    onMessageChange(value);
  };

  const isOverLimit = charCount > characterLimit;

  return (
    <Card>
      <BlockStack gap="400">
        <InlineStack align="space-between">
          <InlineStack gap="300" align="center">
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '16px'
            }}>
              {icon}
            </div>
            <Text as="h3" variant="headingSm">{platform}</Text>
          </InlineStack>
          <Checkbox
            checked={enabled}
            onChange={onToggle}
            label=""
          />
        </InlineStack>

        {enabled && (
          <BlockStack gap="300">
            <TextField
              label="Share Message"
              value={message}
              onChange={handleMessageChange}
              multiline={3}
              autoComplete="off"
              helpText={`${charCount}/${characterLimit} characters`}
              error={isOverLimit ? `Message exceeds ${characterLimit} character limit` : undefined}
            />
            
            <Box padding="300" background="bg-surface-secondary" borderRadius="200">
              <Text as="p" variant="bodyXs" tone="subdued">
                <strong>Preview:</strong> {message.replace('[REFERRAL_LINK]', 'yourstore.com/ref/sarah').replace('[CUSTOMER_NAME]', 'Sarah')}
              </Text>
            </Box>
          </BlockStack>
        )}
      </BlockStack>
    </Card>
  );
};

const MessageTemplatesPanel: React.FC<{ onSelectTemplate: (template: string) => void }> = ({ onSelectTemplate }) => {
  const templates = [
    {
      name: "Friendly Invitation",
      message: "Hey! I found this amazing store and thought you&apos;d love it too! Use my link to get a special discount: [REFERRAL_LINK] 🎉",
      category: "Casual"
    },
    {
      name: "Value-Focused",
      message: "Get 20% off your first order at this incredible store! I'm a happy customer and you will be too: [REFERRAL_LINK]",
      category: "Promotional"
    },
    {
      name: "Personal Recommendation",
      message: "I've been shopping here for months and the quality is amazing! Here's a link to get started with a discount: [REFERRAL_LINK]",
      category: "Trust-building"
    },
    {
      name: "Gift-Style",
      message: "Surprise! I'm sending you a special discount to one of my favorite stores. Treat yourself: [REFERRAL_LINK] 🎁",
      category: "Gifting"
    }
  ];

  return (
    <BlockStack gap="400">
      <Text as="h3" variant="headingSm">Message Templates</Text>
      <Text as="p" variant="bodySm" tone="subdued">
        Click on any template to use it as a starting point for your messaging.
      </Text>
      
      <BlockStack gap="300">
        {templates.map((template, index) => (
          <Card key={index}>
            <BlockStack gap="200">
              <InlineStack align="space-between">
                <Text as="h4" variant="headingXs">{template.name}</Text>
                <Badge tone="info">{template.category}</Badge>
              </InlineStack>
              <Text as="p" variant="bodyXs" tone="subdued">
                {template.message}
              </Text>
              <InlineStack align="end">
                <Button 
                  size="slim" 
                  onClick={() => onSelectTemplate(template.message)}
                >
                  Use Template
                </Button>
              </InlineStack>
            </BlockStack>
          </Card>
        ))}
      </BlockStack>
    </BlockStack>
  );
};

const SharingInsightsPanel: React.FC = () => (
  <BlockStack gap="400">
    <Text as="h3" variant="headingSm">Sharing Insights & Tips</Text>
    
    <BlockStack gap="400">
      <Card background="bg-surface-info">
        <BlockStack gap="200">
          <Text as="h4" variant="headingXs">🎯 Conversion Rates by Platform</Text>
          <List type="bullet">
            <List.Item>WhatsApp & SMS: 15-25% conversion rate</List.Item>
            <List.Item>Email: 8-15% conversion rate</List.Item>
            <List.Item>Facebook: 3-8% conversion rate</List.Item>
            <List.Item>Instagram: 5-12% conversion rate</List.Item>
            <List.Item>Twitter: 2-6% conversion rate</List.Item>
          </List>
        </BlockStack>
      </Card>

      <Card background="bg-surface-warning">
        <BlockStack gap="200">
          <Text as="h4" variant="headingXs">📱 Mobile Optimization</Text>
          <Text as="p" variant="bodyXs">
            70% of social sharing happens on mobile devices. Keep messages short and ensure your referral landing page is mobile-optimized.
          </Text>
        </BlockStack>
      </Card>

      <Card background="bg-surface-success">
        <BlockStack gap="200">
          <Text as="h4" variant="headingXs">⏰ Best Times to Share</Text>
          <List type="bullet">
            <List.Item>Weekends: 20% higher engagement</List.Item>
            <List.Item>Evening hours (6-9 PM): Peak sharing time</List.Item>
            <List.Item>Post-purchase: 3x more likely to share</List.Item>
          </List>
        </BlockStack>
      </Card>
    </BlockStack>
  </BlockStack>
);

export const SocialSharingTab: React.FC<SocialSharingTabProps> = ({ 
  config, 
  onUpdate, 
  loading 
}) => {
  const [formData, setFormData] = useState({
    facebook: {
      enabled: config?.facebook?.enabled ?? true,
      message: config?.facebook?.message || "Check out this amazing store! Use my link to get a special discount: [REFERRAL_LINK]"
    },
    instagram: {
      enabled: config?.instagram?.enabled ?? true,
      message: config?.instagram?.message || "Found something amazing! 🛍️ Get a discount with my link: [REFERRAL_LINK] #shopping #deals"
    },
    twitter: {
      enabled: config?.twitter?.enabled ?? true,
      message: config?.twitter?.message || "Loving this store! Get a discount: [REFERRAL_LINK] #deals"
    },
    whatsapp: {
      enabled: config?.whatsapp?.enabled ?? true,
      message: config?.whatsapp?.message || "Hey [CUSTOMER_NAME]! Check out this store, you&apos;ll love it! Get a discount: [REFERRAL_LINK]"
    },
    email: {
      enabled: config?.email?.enabled ?? true,
      message: config?.email?.message || "I wanted to share one of my favorite stores with you! Use this link to get a special discount: [REFERRAL_LINK]"
    },
    sms: {
      enabled: config?.sms?.enabled ?? false,
      message: config?.sms?.message || "Hey! Check out this store with my referral link: [REFERRAL_LINK]"
    }
  });

  const [selectedSubTab, setSelectedSubTab] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);

  const handlePlatformToggle = useCallback((platform: string, enabled: boolean) => {
    setFormData(prev => ({
      ...prev,
      [platform]: { ...prev[platform as keyof typeof prev], enabled }
    }));
  }, []);

  const handleMessageChange = useCallback((platform: string, message: string) => {
    setFormData(prev => ({
      ...prev,
      [platform]: { ...prev[platform as keyof typeof prev], message }
    }));
  }, []);

  const handleTemplateSelect = useCallback((template: string) => {
    // Apply template to all enabled platforms
    setFormData(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(platform => {
        if (updated[platform as keyof typeof updated].enabled) {
          updated[platform as keyof typeof updated].message = template;
        }
      });
      return updated;
    });
  }, []);

  const handleSave = useCallback(async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      onUpdate(formData);
    } catch (error) {
      console.error('Failed to save configuration:', error);
    }
  }, [formData, onUpdate]);

  const platformConfigs = [
    { key: 'facebook', name: 'Facebook', icon: '📘', color: '#1877F2', limit: 280 },
    { key: 'instagram', name: 'Instagram', icon: '📷', color: '#E4405F', limit: 150 },
    { key: 'twitter', name: 'Twitter/X', icon: '🐦', color: '#1DA1F2', limit: 280 },
    { key: 'whatsapp', name: 'WhatsApp', icon: '💬', color: '#25D366', limit: 1000 },
    { key: 'email', name: 'Email', icon: '📧', color: '#6B7280', limit: 500 },
    { key: 'sms', name: 'SMS', icon: '📱', color: '#10B981', limit: 160 }
  ];

  const subTabs = [
    { id: 'templates', content: 'Message Templates' },
    { id: 'insights', content: 'Sharing Insights' },
  ];

  return (
    <BlockStack gap="500">
      {showSuccess && (
        <Banner title="Social sharing settings saved!" tone="success">
          <p>Your social media configurations have been updated.</p>
        </Banner>
      )}

      <InlineStack gap="600" align="start">
        {/* Left Column - Platform Configuration */}
        <Box minWidth="600px">
          <BlockStack gap="500">
            {/* Header */}
            <BlockStack gap="200">
              <InlineStack gap="200" align="start">
                <Icon source={ShareIcon} tone="base" />
                <Text as="h2" variant="headingLg">Social Sharing Configuration</Text>
              </InlineStack>
              <Text as="p" variant="bodySm" tone="subdued">
                Customize messages for different social platforms
              </Text>
            </BlockStack>

            <Divider />

            {/* Platform Configurations */}
            <BlockStack gap="400">
              <Text as="h3" variant="headingMd">Platform Settings</Text>
              
              <Grid>
                {platformConfigs.map((platform) => (
                  <Grid.Cell key={platform.key} columnSpan={{ xs: 6, sm: 6, md: 6, lg: 6, xl: 6 }}>
                    <PlatformConfig
                      platform={platform.name}
                      icon={platform.icon}
                      enabled={formData[platform.key as keyof typeof formData].enabled}
                      message={formData[platform.key as keyof typeof formData].message}
                      onToggle={(enabled) => handlePlatformToggle(platform.key, enabled)}
                      onMessageChange={(message) => handleMessageChange(platform.key, message)}
                      characterLimit={platform.limit}
                      color={platform.color}
                    />
                  </Grid.Cell>
                ))}
              </Grid>
            </BlockStack>

            {/* Global Settings */}
            <Card>
              <BlockStack gap="400">
                <Text as="h3" variant="headingMd">Global Settings</Text>
                
                <Checkbox
                  label="Auto-generate sharing buttons"
                  helpText="Automatically show social sharing buttons on referral pages"
                  checked={true}
                />

                <Checkbox
                  label="Include store branding"
                  helpText="Add your store logo to shared content"
                  checked={true}
                />

                <Checkbox
                  label="Track social conversions"
                  helpText="Monitor which platforms generate the most referrals"
                  checked={true}
                />
              </BlockStack>
            </Card>

            {/* Variables Help */}
            <Card background="bg-surface-secondary">
              <BlockStack gap="300">
                <Text as="h3" variant="headingSm">Available Variables</Text>
                <Text as="p" variant="bodyXs" tone="subdued">
                  Use these variables in your messages - they'll be automatically replaced:
                </Text>
                <InlineStack gap="400" wrap>
                  <Badge>[REFERRAL_LINK]</Badge>
                  <Badge>[CUSTOMER_NAME]</Badge>
                  <Badge>[STORE_NAME]</Badge>
                  <Badge>[DISCOUNT_AMOUNT]</Badge>
                </InlineStack>
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

        {/* Right Column - Templates & Insights */}
        <Box minWidth="400px">
          <Card>
            <Tabs
              tabs={subTabs}
              selected={selectedSubTab}
              onSelect={setSelectedSubTab}
            >
              <Box paddingBlockStart="400">
                {selectedSubTab === 0 && <MessageTemplatesPanel onSelectTemplate={handleTemplateSelect} />}
                {selectedSubTab === 1 && <SharingInsightsPanel />}
              </Box>
            </Tabs>
          </Card>
        </Box>
      </InlineStack>
    </BlockStack>
  );
}; 