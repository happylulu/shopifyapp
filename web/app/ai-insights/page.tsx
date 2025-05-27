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
  Divider,
  Icon,
  ProgressBar,
  DataTable,
  ButtonGroup
} from '@shopify/polaris';
import {
  MagicIcon,
  RefreshIcon,
  CalendarIcon,
  PersonIcon,
  ChartVerticalIcon
} from '@shopify/polaris-icons';

// Import our types and API
import type { AIPageState } from '../types/ai-insights';
import aiApi from '../services/aiApi';

// Import AI components
import { AIOpportunityInsight } from './components/AIOpportunityInsight';
import { SmartSegmentation } from './components/SmartSegmentation'; 
import { ActionCenter } from './components/ActionCenter';
import { PerformanceMetrics } from './components/PerformanceMetrics';

export default function AIInsightsPage() {
  const [selectedTab, setSelectedTab] = useState(0);
  const [state, setState] = useState<AIPageState>({
    insights: null,
    performance: null,
    loading: true,
    error: null,
    selectedOpportunity: null,
    refreshing: false,
  });

  // Load AI insights data
  const loadData = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const [insights, performance] = await Promise.all([
        aiApi.getAIInsights(30),
        aiApi.getPerformanceMetrics(),
      ]);

      setState(prev => ({
        ...prev,
        insights,
        performance,
        loading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to load AI insights',
        loading: false,
      }));
    }
  }, []);

  // Refresh insights
  const handleRefresh = useCallback(async () => {
    setState(prev => ({ ...prev, refreshing: true }));
    
    try {
      const result = await aiApi.refreshInsights();
      
      // Show success and reload data
      setTimeout(() => {
        loadData();
      }, 1000);
      
    } catch (error) {
      console.error('Failed to refresh insights:', error);
    } finally {
      setState(prev => ({ ...prev, refreshing: false }));
    }
  }, [loadData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Tab configuration
  const tabs = [
    { id: 'opportunities', content: 'AI Opportunities', accessibilityLabel: 'AI opportunities' },
    { id: 'segments', content: 'Customer Segments', accessibilityLabel: 'Customer segments' },
    { id: 'actions', content: 'Action Center', accessibilityLabel: 'Action center' },
    { id: 'performance', content: 'Performance', accessibilityLabel: 'AI performance' },
  ];

  // Loading state
  if (state.loading) {
    return (
      <Page
        title="AI Customer Insights"
        subtitle="Smart customer segmentation powered by AI insights"
      >
        <Card>
          <Box paddingBlockStart="800" paddingBlockEnd="800">
            <InlineStack align="center" gap="400">
              <Spinner accessibilityLabel="Loading AI insights" size="large" />
              <BlockStack gap="200">
                <Text as="p" variant="bodyMd">Analyzing customer behavior...</Text>
                <Text as="p" variant="bodySm" tone="subdued">This may take a few moments</Text>
              </BlockStack>
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
        title="AI Customer Insights"
        subtitle="Smart customer segmentation powered by AI insights"
      >
        <Banner title="Error loading AI insights" tone="critical">
          <p>{state.error}</p>
        </Banner>
        <Box paddingBlockStart="400">
          <InlineStack align="center">
            <Button onClick={loadData} variant="primary">
              Try Again
            </Button>
          </InlineStack>
        </Box>
      </Page>
    );
  }

  const insights = state.insights!;
  const performance = state.performance!;

  // Key metrics for the header
  const keyMetrics = [
    {
      label: 'Total Customers',
      value: insights.total_customers.toLocaleString(),
      change: '+12%',
      positive: true,
      icon: '👥'
    },
    {
      label: 'AI Opportunities',
      value: insights.opportunities.length.toString(),
      change: 'New insights',
      positive: true,
      icon: '🎯'
    },
    {
      label: 'Success Rate',
      value: `${(performance.success_rate * 100).toFixed(1)}%`,
      change: '+5.2%',
      positive: true,
      icon: '📈'
    },
    {
      label: 'Revenue Impact',
      value: aiApi.formatCurrency(performance.revenue_generated),
      change: '+$2,450',
      positive: true,
      icon: '💰'
    }
  ];

  return (
    <div className="ai-insights-page">
      <Page
        title="AI Customer Insights"
        subtitle="Smart customer segmentation powered by AI insights"
        primaryAction={{
          content: 'Refresh Insights',
          onAction: handleRefresh,
          loading: state.refreshing,
          icon: RefreshIcon,
        }}
        secondaryActions={[
          {
            content: 'Create Segment',
            icon: PersonIcon,
            onAction: () => {
              // This would open a create segment modal
              console.log('Create segment clicked');
            }
          }
        ]}
      >
        {/* Header with Key Metrics */}
        <Box paddingBlockEnd="500">
          <Card>
            <BlockStack gap="400">
              <InlineStack align="space-between">
                <BlockStack gap="200">
                  <InlineStack gap="200" align="center">
                    <Icon source={MagicIcon} tone="magic" />
                    <Text as="h2" variant="headingMd">AI Dashboard</Text>
                    <Badge tone="new">New</Badge>
                  </InlineStack>
                  <Text as="p" variant="bodySm" tone="subdued">
                    Last updated: {aiApi.formatDate(insights.insights_generated_at)}
                  </Text>
                </BlockStack>
                
                <InlineStack gap="200">
                  <Text as="p" variant="bodyXs" tone="subdued">
                    Next update: {aiApi.formatDate(insights.next_update_at)}
                  </Text>
                </InlineStack>
              </InlineStack>

              <Divider />

              {/* Key Metrics Grid */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                gap: '16px' 
              }}>
                {keyMetrics.map((metric, index) => (
                  <Card key={index} background="bg-surface-secondary">
                    <BlockStack gap="200">
                      <InlineStack align="space-between">
                        <Text as="p" variant="bodyXs" tone="subdued">{metric.label}</Text>
                        <span style={{ fontSize: '16px' }}>{metric.icon}</span>
                      </InlineStack>
                      <Text as="p" variant="headingMd">{metric.value}</Text>
                      <InlineStack gap="100">
                        <Text 
                          as="span" 
                          variant="bodyXs" 
                          tone={metric.positive ? 'success' : 'critical'}
                        >
                          {metric.positive ? '↗' : '↘'} {metric.change}
                        </Text>
                        <Text as="span" variant="bodyXs" tone="subdued">vs last period</Text>
                      </InlineStack>
                    </BlockStack>
                  </Card>
                ))}
              </div>
            </BlockStack>
          </Card>
        </Box>

        {/* Main Content Tabs */}
        <Card>
          <Tabs
            tabs={tabs}
            selected={selectedTab}
            onSelect={setSelectedTab}
          >
            <Box paddingBlockStart="500">
              {selectedTab === 0 && (
                <AIOpportunityInsight
                  opportunities={insights.opportunities}
                  onSelectOpportunity={(opportunity) => {
                    setState(prev => ({ ...prev, selectedOpportunity: opportunity }));
                  }}
                  selectedOpportunity={state.selectedOpportunity}
                />
              )}
              
              {selectedTab === 1 && (
                <SmartSegmentation
                  segments={insights.segments}
                  totalCustomers={insights.total_customers}
                />
              )}
              
              {selectedTab === 2 && (
                <ActionCenter
                  opportunities={insights.opportunities}
                  performance={performance}
                />
              )}
              
              {selectedTab === 3 && (
                <PerformanceMetrics
                  metrics={performance}
                />
              )}
            </Box>
          </Tabs>
        </Card>

        {/* Quick Actions Footer */}
        <Box paddingBlockStart="500">
          <Card background="bg-surface-secondary">
            <BlockStack gap="300">
              <Text as="h3" variant="headingSm">Quick Actions</Text>
              <InlineStack gap="300" wrap>
                <Button variant="secondary" size="slim">
                  Export Customer Data
                </Button>
                <Button variant="secondary" size="slim">
                  Schedule AI Report
                </Button>
                <Button variant="secondary" size="slim">
                  Configure Alerts
                </Button>
                <Button variant="secondary" size="slim">
                  View AI Training
                </Button>
              </InlineStack>
            </BlockStack>
          </Card>
        </Box>
      </Page>

      <style jsx>{`
        .ai-insights-page {
          background: linear-gradient(135deg, #f0f9ff 0%, #f0fdf4 100%);
          min-height: 100vh;
        }
        
        .ai-insights-page :global(.Polaris-Card) {
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          border: 1px solid rgba(59, 130, 246, 0.1);
        }
        
        .ai-insights-page :global(.Polaris-Badge--toneNew) {
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          color: white;
        }
        
        .ai-insights-page :global(.Polaris-Button--variantPrimary) {
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          border: none;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }
        
        .ai-insights-page :global(.Polaris-Tabs__Tab--selected) {
          border-bottom-color: #3b82f6;
        }
        
        .ai-insights-page :global(.Polaris-Text--toneSuccess) {
          color: #16a34a;
        }
      `}</style>
    </div>
  );
} 