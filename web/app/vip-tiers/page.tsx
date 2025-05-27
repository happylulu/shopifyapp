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
  Icon,
  ProgressBar,
  Thumbnail,
  DataTable,
  EmptyState
} from '@shopify/polaris';
import {
  StarFilledIcon,
  PersonIcon,
  ChartVerticalIcon,
  SettingsIcon,
  StarIcon,
  GiftCardIcon
} from '@shopify/polaris-icons';

// Import types and API
import { VIPPageState, VIPTierLevel } from '../types/vip';
import vipApi from '../services/vipApi';

// Import tab components
import { ProgramOverview } from './components/ProgramOverview';
import { MemberManagement } from './components/MemberManagement';
import { TierSettings } from './components/TierSettings';
import { CustomerView } from './components/CustomerView';

export default function VIPTiersPage() {
  const [state, setState] = useState<VIPPageState>({
    activeTab: 'overview',
    config: null,
    members: [],
    analytics: null,
    loading: true,
    error: null,
    selectedTier: null,
  });

  // Load initial data
  const loadData = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const [config, membersResponse, analyticsResponse] = await Promise.all([
        vipApi.getConfig(),
        vipApi.getMembers(),
        vipApi.getAnalytics(),
      ]);

      setState(prev => ({
        ...prev,
        config,
        members: membersResponse.members,
        analytics: analyticsResponse.analytics || null,
        loading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to load VIP data',
        loading: false,
      }));
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle tab change
  const handleTabChange = useCallback((selectedTabIndex: number) => {
    const tabs: Array<VIPPageState['activeTab']> = ['overview', 'members', 'tiers', 'analytics'];
    setState(prev => ({ ...prev, activeTab: tabs[selectedTabIndex] }));
  }, []);

  // Tab configuration
  const tabs = [
    {
      id: 'overview',
      content: 'Program Overview',
    },
    {
      id: 'members',
      content: 'Member Management',
    },
    {
      id: 'tiers',
      content: 'Tier Settings',
    },
    {
      id: 'analytics',
      content: 'Customer View',
    },
  ];

  // Loading state
  if (state.loading) {
    return (
      <Page
        title="VIP Tiers Program"
        subtitle="Create a premium experience for your most valuable customers"
      >
        <Card>
          <Box paddingBlockStart="800" paddingBlockEnd="800">
            <InlineStack align="center">
              <Spinner accessibilityLabel="Loading VIP data" size="large" />
              <Text as="p" tone="subdued">Loading VIP program data...</Text>
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
        title="VIP Tiers Program"
        subtitle="Create a premium experience for your most valuable customers"
      >
        <Banner title="Error loading VIP data" tone="critical">
          <p>{state.error}</p>
        </Banner>
        <Box paddingBlockStart="400">
          <InlineStack align="center">
            <Button onClick={loadData}>Try Again</Button>
          </InlineStack>
        </Box>
      </Page>
    );
  }

  // Get tier color based on level
  const getTierColor = (level: VIPTierLevel): string => {
    const colors = {
      [VIPTierLevel.BRONZE]: '#CD7F32',
      [VIPTierLevel.SILVER]: '#C0C0C0',
      [VIPTierLevel.GOLD]: '#FFD700',
      [VIPTierLevel.PLATINUM]: '#E5E4E2',
    };
    return colors[level] || '#6B7280';
  };

  return (
    <div className="vip-tiers-page">
      <Page
        title="👑 VIP Tiers Program"
        subtitle="Create a premium experience for your most valuable customers with exclusive rewards and tiered benefits"
        primaryAction={{
          content: 'Launch VIP Program',
          icon: StarIcon,
          disabled: state.config?.is_active,
          onAction: () => console.log('Launch VIP Program'),
        }}
        secondaryActions={[
          {
            content: 'View Documentation',
            url: '#',
            external: true,
          },
        ]}
      >
        {/* Header Statistics */}
        <Box paddingBlockEnd="500">
          <Card>
            <BlockStack gap="400">
              <InlineStack align="space-between" wrap={false}>
                <Box minWidth="150px">
                  <BlockStack gap="100">
                    <InlineStack gap="200" align="center">
                      <Icon source={PersonIcon} tone="base" />
                      <Text as="p" variant="bodySm" tone="subdued">VIP Customers</Text>
                    </InlineStack>
                    <Text as="p" variant="headingLg" fontWeight="bold">
                      {state.analytics?.total_vip_members.toLocaleString() || '0'}
                    </Text>
                    <Text as="p" variant="bodySm" tone="success">
                      +12% from last month
                    </Text>
                  </BlockStack>
                </Box>

                <Box minWidth="150px">
                  <BlockStack gap="100">
                    <InlineStack gap="200" align="center">
                      <Icon source={StarIcon} tone="base" />
                      <Text as="p" variant="bodySm" tone="subdued">VIP Retention Rate</Text>
                    </InlineStack>
                    <Text as="p" variant="headingLg" fontWeight="bold">
                      {state.analytics ? `${(state.analytics.vip_retention_rate * 100).toFixed(0)}%` : '0%'}
                    </Text>
                    <Text as="p" variant="bodySm" tone="success">
                      +5% from last month
                    </Text>
                  </BlockStack>
                </Box>

                <Box minWidth="150px">
                  <BlockStack gap="100">
                    <InlineStack gap="200" align="center">
                      <Icon source={ChartVerticalIcon} tone="base" />
                      <Text as="p" variant="bodySm" tone="subdued">Avg. VIP Spend</Text>
                    </InlineStack>
                    <Text as="p" variant="headingLg" fontWeight="bold">
                      ${state.analytics?.avg_vip_order_value.toFixed(0) || '0'}
                    </Text>
                    <Text as="p" variant="bodySm" tone="success">
                      +23% from last month
                    </Text>
                  </BlockStack>
                </Box>

                <Box minWidth="150px">
                  <BlockStack gap="100">
                    <InlineStack gap="200" align="center">
                      <Icon source={GiftCardIcon} tone="base" />
                      <Text as="p" variant="bodySm" tone="subdued">Gold Tier Members</Text>
                    </InlineStack>
                    <Text as="p" variant="headingLg" fontWeight="bold">
                      {state.analytics?.members_by_tier.gold || 0}
                    </Text>
                    <Text as="p" variant="bodySm" tone="success">
                      +8% from last month
                    </Text>
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
            selected={tabs.findIndex(tab => tab.id === state.activeTab)}
            onSelect={handleTabChange}
          >
            <Box paddingBlockStart="500">
              {state.activeTab === 'overview' && (
                <ProgramOverview
                  config={state.config}
                  analytics={state.analytics}
                  onRefresh={loadData}
                />
              )}
              
              {state.activeTab === 'members' && (
                <MemberManagement
                  members={state.members}
                  tiers={state.config?.tiers || []}
                  onRefresh={loadData}
                />
              )}
              
              {state.activeTab === 'tiers' && (
                <TierSettings
                  config={state.config}
                  onUpdate={loadData}
                />
              )}
              
              {state.activeTab === 'analytics' && (
                <CustomerView
                  analytics={state.analytics}
                  config={state.config}
                />
              )}
            </Box>
          </Tabs>
        </Card>
      </Page>

      <style jsx>{`
        .vip-tiers-page {
          background: linear-gradient(135deg, #f8f4ff 0%, #fff4e6 100%);
          min-height: 100vh;
        }
        
        .vip-tiers-page :global(.Polaris-Card) {
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          border: 1px solid rgba(139, 92, 246, 0.1);
        }
        
        .vip-tiers-page :global(.Polaris-Badge) {
          font-weight: 600;
        }
        
        .vip-tiers-page :global(.Polaris-Button--variantPrimary) {
          background: linear-gradient(135deg, #8b5cf6, #7c3aed);
          border: none;
          box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
        }
        
        .vip-tiers-page :global(.Polaris-Tabs__Tab--selected) {
          border-bottom-color: #8b5cf6;
        }
      `}</style>
    </div>
  );
} 