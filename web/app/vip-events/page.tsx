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
  DataTable,
  EmptyState,
  Filters,
  ChoiceList,
  TextField
} from '@shopify/polaris';
import {
  CalendarIcon,
  ChartVerticalIcon,
  ClockIcon,
  PersonIcon,
  StarIcon,
  PlusIcon
} from '@shopify/polaris-icons';
import { useRouter } from 'next/navigation';

// Import types and API
import { VIPEvent, EventStatus, EventListResponse } from '../types/events';
import eventsApi from '../services/eventsApi';

// Import components
import { EventOverview } from './components/EventOverview';
import { EventTimeline } from './components/EventTimeline';
import { EventCalendar } from './components/EventCalendar';
import { AllEvents } from './components/AllEvents';

export default function VIPEventsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [eventData, setEventData] = useState<EventListResponse | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [availableTargets, setAvailableTargets] = useState<any>(null);

  // Load data
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [eventsResponse, targetsResponse] = await Promise.all([
        eventsApi.getEvents(),
        eventsApi.getAvailableTargets()
      ]);

      setEventData(eventsResponse);
      setAvailableTargets(targetsResponse.targets);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load events');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Tab configuration
  const tabs = [
    {
      id: 'overview',
      content: 'Overview'
    },
    {
      id: 'timeline',
      content: 'Event Timeline'
    },
    {
      id: 'calendar',
      content: 'Calendar'
    },
    {
      id: 'all-events',
      content: 'All Events'
    }
  ];

  // Loading state
  if (loading) {
    return (
      <Page
        title="VIP Events & AI-Targeted Campaigns"
        subtitle="Schedule targeted loyalty events for VIP tiers and AI customer segments"
        primaryAction={{
          content: 'Create VIP Event',
          icon: PlusIcon,
          onAction: () => router.push('/vip-events/new')
        }}
      >
        <Card>
          <Box paddingBlockStart="800" paddingBlockEnd="800">
            <InlineStack align="center">
              <Spinner accessibilityLabel="Loading events" size="large" />
              <Text as="p" tone="subdued">Loading VIP events...</Text>
            </InlineStack>
          </Box>
        </Card>
      </Page>
    );
  }

  // Error state
  if (error) {
    return (
      <Page
        title="VIP Events & AI-Targeted Campaigns"
        subtitle="Schedule targeted loyalty events for VIP tiers and AI customer segments"
      >
        <Banner title="Error loading events" tone="critical">
          <p>{error}</p>
        </Banner>
        <Box paddingBlockStart="400">
          <InlineStack align="center">
            <Button onClick={loadData}>Try Again</Button>
          </InlineStack>
        </Box>
      </Page>
    );
  }

  return (
    <div className="vip-events-page">
      <Page
        title="VIP Events & AI-Targeted Campaigns"
        subtitle="Schedule targeted loyalty events for VIP tiers and AI customer segments"
        primaryAction={{
          content: 'Create VIP Event',
          icon: PlusIcon,
          onAction: () => router.push('/vip-events/new')
        }}
      >
        {/* Header Statistics */}
        <Box paddingBlockEnd="500">
          <Card>
            <BlockStack gap="400">
              <InlineStack align="space-between" wrap={false}>
                <Box minWidth="150px">
                  <BlockStack gap="100">
                    <InlineStack gap="200" align="center">
                      <Icon source={ChartVerticalIcon} tone="success" />
                      <Text as="p" variant="bodySm" tone="subdued">Active Events</Text>
                    </InlineStack>
                    <Text as="p" variant="headingLg" fontWeight="bold">
                      {eventData?.active_count || 0}
                    </Text>
                    <Text as="p" variant="bodySm" tone="subdued">
                      Currently running
                    </Text>
                  </BlockStack>
                </Box>

                <Box minWidth="150px">
                  <BlockStack gap="100">
                    <InlineStack gap="200" align="center">
                      <Icon source={CalendarIcon} tone="info" />
                      <Text as="p" variant="bodySm" tone="subdued">Scheduled</Text>
                    </InlineStack>
                    <Text as="p" variant="headingLg" fontWeight="bold">
                      {eventData?.scheduled_count || 0}
                    </Text>
                    <Text as="p" variant="bodySm" tone="subdued">
                      Ready to launch
                    </Text>
                  </BlockStack>
                </Box>

                <Box minWidth="150px">
                  <BlockStack gap="100">
                    <InlineStack gap="200" align="center">
                      <Icon source={ClockIcon} tone="warning" />
                      <Text as="p" variant="bodySm" tone="subdued">Drafts</Text>
                    </InlineStack>
                    <Text as="p" variant="headingLg" fontWeight="bold">
                      {eventData?.draft_count || 0}
                    </Text>
                    <Text as="p" variant="bodySm" tone="subdued">
                      Being prepared
                    </Text>
                  </BlockStack>
                </Box>

                <Box minWidth="150px">
                  <BlockStack gap="100">
                    <InlineStack gap="200" align="center">
                      <Icon source={PersonIcon} tone="base" />
                      <Text as="p" variant="bodySm" tone="subdued">Total Events</Text>
                    </InlineStack>
                    <Text as="p" variant="headingLg" fontWeight="bold">
                      {eventData?.total || 0}
                    </Text>
                    <Text as="p" variant="bodySm" tone="subdued">
                      All time
                    </Text>
                  </BlockStack>
                </Box>
              </InlineStack>
            </BlockStack>
          </Card>
        </Box>

        {/* Available Targets Summary */}
        {availableTargets && (
          <Box paddingBlockEnd="500">
            <Card>
              <BlockStack gap="400">
                <InlineStack align="space-between">
                  <BlockStack gap="200">
                    <InlineStack gap="200" align="center">
                      <Icon source={PersonIcon} tone="base" />
                      <Text as="h3" variant="headingSm">VIP Tiers Available</Text>
                    </InlineStack>
                    <InlineStack gap="200" wrap>
                      {availableTargets.vip_tiers.slice(0, 4).map((tier: string) => (
                        <Badge key={tier} tone="info">{tier}</Badge>
                      ))}
                    </InlineStack>
                  </BlockStack>

                  <BlockStack gap="200">
                    <InlineStack gap="200" align="center">
                      <Icon source={ChartVerticalIcon} tone="base" />
                      <Text as="h3" variant="headingSm">AI Segments Available</Text>
                    </InlineStack>
                    <InlineStack gap="200" wrap>
                      {availableTargets.ai_segments.slice(0, 3).map((segment: string) => (
                        <Badge key={segment} tone="success">{segment}</Badge>
                      ))}
                      {availableTargets.ai_segments.length > 3 && (
                        <Text as="span" variant="bodySm" tone="subdued">
                          +{availableTargets.ai_segments.length - 3} more
                        </Text>
                      )}
                    </InlineStack>
                  </BlockStack>
                </InlineStack>
              </BlockStack>
            </Card>
          </Box>
        )}

        {/* Main Content Tabs */}
        <Card>
          <Tabs
            tabs={tabs}
            selected={activeTab}
            onSelect={setActiveTab}
          >
            <Box paddingBlockStart="500">
              {activeTab === 0 && (
                <EventOverview 
                  events={eventData?.events || []} 
                  onRefresh={loadData}
                />
              )}
              
              {activeTab === 1 && (
                <EventTimeline 
                  events={eventData?.events || []}
                  onRefresh={loadData}
                />
              )}
              
              {activeTab === 2 && (
                <EventCalendar 
                  events={eventData?.events || []}
                  onRefresh={loadData}
                />
              )}
              
              {activeTab === 3 && (
                <AllEvents 
                  events={eventData?.events || []}
                  onRefresh={loadData}
                />
              )}
            </Box>
          </Tabs>
        </Card>
      </Page>

      <style jsx>{`
        .vip-events-page {
          background: linear-gradient(135deg, #f0f4ff 0%, #fff0f4 100%);
          min-height: 100vh;
        }
        
        .vip-events-page :global(.Polaris-Card) {
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          border: 1px solid rgba(99, 102, 241, 0.1);
        }
        
        .vip-events-page :global(.Polaris-Badge) {
          font-weight: 600;
        }
        
        .vip-events-page :global(.Polaris-Button--variantPrimary) {
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          border: none;
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
        }
        
        .vip-events-page :global(.Polaris-Tabs__Tab--selected) {
          border-bottom-color: #6366f1;
        }
      `}</style>
    </div>
  );
} 