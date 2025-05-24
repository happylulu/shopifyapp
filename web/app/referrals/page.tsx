"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
  Page,
  Card,
  Tabs,
  BlockStack,
  InlineStack,
  Text,
  Button,
  Box,
  Badge,
  Banner,
  Spinner,
  Divider
} from '@shopify/polaris';
import {
  ShareIcon,
  LinkIcon,
  ChartVerticalIcon,
  SettingsIcon
} from '@shopify/polaris-icons';

// Import our types and API
import type { ReferralPageState, TabKey } from '../types/referrals';
import referralApi from '../services/referralApi';

// Import the comprehensive tab components
import { LinkConfigurationTab } from './components/LinkConfigurationTab';
import { SocialSharingTab } from './components/SocialSharingTab';
import { AnalyticsTab } from './components/AnalyticsTab';
import { ReferralLinksTab } from './components/ReferralLinksTab';

export default function ReferralsPage() {
  const [selectedTab, setSelectedTab] = useState<TabKey>('link-config');
  const [state, setState] = useState<ReferralPageState>({
    activeTab: 'link-config',
    linkConfig: null,
    socialConfig: null,
    analytics: null,
    referralLinks: [],
    loading: true,
    error: null,
  });

  // Load initial data
  const loadData = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const [linkConfig, socialConfig, analytics] = await Promise.all([
        referralApi.getLinkConfig(),
        referralApi.getSocialConfig(),
        referralApi.getAnalytics(30),
      ]);

      setState(prev => ({
        ...prev,
        linkConfig,
        socialConfig,
        analytics,
        loading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to load data',
        loading: false,
      }));
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle tab change
  const handleTabChange = useCallback((selectedTabIndex: number) => {
    const tabs: TabKey[] = ['link-config', 'social-config', 'analytics', 'links'];
    const newTab = tabs[selectedTabIndex];
    setSelectedTab(newTab);
    setState(prev => ({ ...prev, activeTab: newTab }));
  }, []);

  // Update configuration handlers
  const handleLinkConfigUpdate = useCallback((newConfig: any) => {
    setState(prev => ({ ...prev, linkConfig: newConfig }));
  }, []);

  const handleSocialConfigUpdate = useCallback((newConfig: any) => {
    setState(prev => ({ ...prev, socialConfig: newConfig }));
  }, []);

  // Error retry handler
  const handleRetry = useCallback(() => {
    loadData();
  }, [loadData]);

  // Tab configuration
  const tabs = [
    {
      id: 'link-config',
      content: 'Link Configuration',
    },
    {
      id: 'social-config', 
      content: 'Social Sharing',
    },
    {
      id: 'analytics',
      content: 'Analytics',
    },
    {
      id: 'links',
      content: 'Manage Links',
    },
  ];

  // Loading state
  if (state.loading) {
    return (
      <Page
        title="Referral Program"
        subtitle="Grow your business with customer referrals"
      >
        <Card>
          <Box paddingBlockStart="800" paddingBlockEnd="800">
            <InlineStack align="center">
              <Spinner accessibilityLabel="Loading referral data" size="large" />
              <Text as="p" tone="subdued">Loading referral data...</Text>
            </InlineStack>
          </Box>
        </Card>
      </Page>
    );
  }

  // Error state
  if (state.error) {
    return (
      <Page
        title="Referral Program"
        subtitle="Grow your business with customer referrals"
      >
        <Banner title="Error loading referral data" tone="critical">
          <p>{state.error}</p>
        </Banner>
        <Box paddingBlockStart="400">
          <InlineStack align="center">
            <Button onClick={handleRetry}>Try Again</Button>
          </InlineStack>
        </Box>
      </Page>
    );
  }

  // Main page content
  return (
    <div className="referrals-page">
      <Page
        title="Referral Program"
        subtitle="Grow your business with word-of-mouth marketing"
        primaryAction={{
          content: 'View Documentation',
          url: '#',
          external: true,
        }}
      >
        {/* Header Statistics */}
        <Box paddingBlockEnd="500">
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">Program Overview</Text>
              <InlineStack align="space-between" wrap={false}>
                <Box>
                  <BlockStack gap="100">
                    <Text as="p" variant="bodyLg" fontWeight="semibold" tone="success">
                      {state.analytics?.total_links || 0}
                    </Text>
                    <Text as="p" variant="bodySm" tone="subdued">Active Links</Text>
                  </BlockStack>
                </Box>
                <Box>
                  <BlockStack gap="100">
                    <Text as="p" variant="bodyLg" fontWeight="semibold">
                      {state.analytics?.total_clicks || 0}
                    </Text>
                    <Text as="p" variant="bodySm" tone="subdued">Total Clicks</Text>
                  </BlockStack>
                </Box>
                <Box>
                  <BlockStack gap="100">
                    <Text as="p" variant="bodyLg" fontWeight="semibold">
                      {state.analytics?.conversion_rate || 0}%
                    </Text>
                    <Text as="p" variant="bodySm" tone="subdued">Conversion Rate</Text>
                  </BlockStack>
                </Box>
                <Box>
                  <BlockStack gap="100">
                    <Badge tone="success">
                      {`$${state.analytics?.revenue_today?.toFixed(2) || '0.00'}`}
                    </Badge>
                    <Text as="p" variant="bodySm" tone="subdued">Revenue Generated</Text>
                  </BlockStack>
                </Box>
              </InlineStack>
            </BlockStack>
          </Card>
        </Box>

        {/* Main Content Tabs */}
        <Card>
          <Tabs
            tabs={tabs}
            selected={tabs.findIndex(tab => tab.id === selectedTab)}
            onSelect={handleTabChange}
          >
            <Box paddingBlockStart="500">
              {selectedTab === 'link-config' && (
                <LinkConfigurationTab
                  config={state.linkConfig}
                  onUpdate={handleLinkConfigUpdate}
                  loading={state.loading}
                />
              )}
              
              {selectedTab === 'social-config' && (
                <SocialSharingTab
                  config={state.socialConfig}
                  onUpdate={handleSocialConfigUpdate}
                  loading={state.loading}
                />
              )}
              
              {selectedTab === 'analytics' && (
                <AnalyticsTab
                  analytics={state.analytics}
                  onRefresh={loadData}
                  loading={state.loading}
                />
              )}
              
              {selectedTab === 'links' && (
                <ReferralLinksTab
                  links={state.referralLinks}
                  onRefresh={loadData}
                  loading={state.loading}
                />
              )}
            </Box>
          </Tabs>
        </Card>

        {/* Help Section */}
        <Box paddingBlockStart="500">
          <Card background="bg-surface-secondary">
            <BlockStack gap="300">
              <Text as="h3" variant="headingSm">Need Help?</Text>
              <Text as="p" variant="bodySm" tone="subdued">
                Learn how to set up and optimize your referral program for maximum growth.
              </Text>
              <InlineStack gap="300">
                <Button variant="tertiary" size="slim">
                  View Documentation
                </Button>
                <Button variant="tertiary" size="slim">
                  Contact Support
                </Button>
              </InlineStack>
            </BlockStack>
          </Card>
        </Box>
      </Page>

      <style jsx>{`
        .referrals-page {
          background: linear-gradient(135deg, #f0fdf4 0%, #fef3e7 100%);
          min-height: 100vh;
        }
        
        .referrals-page :global(.Polaris-Card) {
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          border: 1px solid rgba(34, 197, 94, 0.1);
        }
        
        .referrals-page :global(.Polaris-Badge--toneSuccess) {
          background: linear-gradient(135deg, #22c55e, #16a34a);
          color: white;
        }
        
        .referrals-page :global(.Polaris-Button--variantPrimary) {
          background: linear-gradient(135deg, #22c55e, #16a34a);
          border: none;
          box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
        }
        
        .referrals-page :global(.Polaris-Button--variantSecondary) {
          background: linear-gradient(135deg, #fb923c, #f97316);
          color: white;
          border: none;
          box-shadow: 0 4px 12px rgba(251, 146, 60, 0.3);
        }
        
        .referrals-page :global(.Polaris-Tabs__Tab--selected) {
          border-bottom-color: #22c55e;
        }
        
        .referrals-page :global(.Polaris-Text--toneSuccess) {
          color: #16a34a;
        }
      `}</style>
    </div>
  );
} 