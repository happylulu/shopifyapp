import React from 'react';
import {
  BlockStack,
  InlineStack,
  Text,
  Box,
  Card,
  Badge,
  Button,
  Icon,
  ProgressBar,
  DataTable
} from '@shopify/polaris';
import {
  ChartVerticalIcon,
  PersonIcon,
  StarIcon,
  ChartLineIcon
} from '@shopify/polaris-icons';
import { VIPEvent, EventStatus } from '../../types/events';
import { useRouter } from 'next/navigation';

interface EventOverviewProps {
  events: VIPEvent[];
  onRefresh: () => void;
}

export function EventOverview({ events, onRefresh }: EventOverviewProps) {
  const router = useRouter();

  // Calculate metrics
  const activeEvents = events.filter(e => e.status === EventStatus.ACTIVE);
  const totalParticipants = activeEvents.reduce((sum, e) => sum + e.total_participants, 0);
  const totalRevenue = activeEvents.reduce((sum, e) => sum + e.total_revenue_generated, 0);
  const avgRevenuePerEvent = activeEvents.length > 0 ? totalRevenue / activeEvents.length : 0;

  // Get top performing events
  const topEvents = [...activeEvents]
    .sort((a, b) => b.total_revenue_generated - a.total_revenue_generated)
    .slice(0, 5);

  return (
    <BlockStack gap="600">
      {/* Metrics Cards */}
      <Box>
        <InlineStack gap="400" wrap>
          <Box minWidth="250px">
            <Card>
              <BlockStack gap="200">
                <InlineStack gap="200" align="center">
                  <Icon source={ChartVerticalIcon} tone="success" />
                  <Text as="h3" variant="headingSm">Active Campaigns</Text>
                </InlineStack>
                <Text as="p" variant="heading2xl" fontWeight="bold">
                  {activeEvents.length}
                </Text>
                <Text as="p" variant="bodySm" tone="success">
                  +2 from last month
                </Text>
              </BlockStack>
            </Card>
          </Box>

          <Box minWidth="250px">
            <Card>
              <BlockStack gap="200">
                <InlineStack gap="200" align="center">
                  <Icon source={PersonIcon} tone="info" />
                  <Text as="h3" variant="headingSm">Total Participants</Text>
                </InlineStack>
                <Text as="p" variant="heading2xl" fontWeight="bold">
                  {totalParticipants.toLocaleString()}
                </Text>
                <Text as="p" variant="bodySm" tone="success">
                  +15% engagement rate
                </Text>
              </BlockStack>
            </Card>
          </Box>

          <Box minWidth="250px">
            <Card>
              <BlockStack gap="200">
                <InlineStack gap="200" align="center">
                  <Icon source={ChartLineIcon} tone="warning" />
                  <Text as="h3" variant="headingSm">Revenue Generated</Text>
                </InlineStack>
                <Text as="p" variant="heading2xl" fontWeight="bold">
                  ${totalRevenue.toLocaleString()}
                </Text>
                <Text as="p" variant="bodySm" tone="success">
                  +23% from campaigns
                </Text>
              </BlockStack>
            </Card>
          </Box>

          <Box minWidth="250px">
            <Card>
              <BlockStack gap="200">
                <InlineStack gap="200" align="center">
                  <Icon source={StarIcon} tone="base" />
                  <Text as="h3" variant="headingSm">Avg Revenue/Event</Text>
                </InlineStack>
                <Text as="p" variant="heading2xl" fontWeight="bold">
                  ${avgRevenuePerEvent.toFixed(0)}
                </Text>
                <Text as="p" variant="bodySm" tone="success">
                  +8% efficiency
                </Text>
              </BlockStack>
            </Card>
          </Box>
        </InlineStack>
      </Box>

      {/* Active Events Summary */}
      <Card>
        <BlockStack gap="400">
          <InlineStack align="space-between">
            <Text as="h2" variant="headingLg">Active Events Performance</Text>
            <Button onClick={onRefresh}>Refresh</Button>
          </InlineStack>

          {activeEvents.length > 0 ? (
            <BlockStack gap="400">
              {activeEvents.map(event => {
                const progressPercentage = event.max_participants 
                  ? (event.total_participants / event.max_participants) * 100
                  : 0;

                return (
                  <Box key={event.id} background="bg-surface-secondary" padding="400" borderRadius="200">
                    <BlockStack gap="300">
                      <InlineStack align="space-between">
                        <InlineStack gap="300" align="center">
                          <Text as="span" variant="headingLg">{event.icon}</Text>
                          <BlockStack gap="100">
                            <Text as="h4" variant="headingMd">{event.name}</Text>
                            <Text as="p" variant="bodySm" tone="subdued">
                              {event.description}
                            </Text>
                          </BlockStack>
                        </InlineStack>
                        <Button
                          size="slim"
                          onClick={() => router.push(`/vip-events/${event.id}`)}
                        >
                          View Details
                        </Button>
                      </InlineStack>

                      <InlineStack gap="600" wrap>
                        <BlockStack gap="100">
                          <Text as="p" variant="bodySm" tone="subdued">Participants</Text>
                          <Text as="p" variant="bodyMd" fontWeight="semibold">
                            {event.total_participants}
                            {event.max_participants && ` / ${event.max_participants}`}
                          </Text>
                        </BlockStack>

                        <BlockStack gap="100">
                          <Text as="p" variant="bodySm" tone="subdued">Revenue</Text>
                          <Text as="p" variant="bodyMd" fontWeight="semibold">
                            ${event.total_revenue_generated.toLocaleString()}
                          </Text>
                        </BlockStack>

                        <BlockStack gap="100">
                          <Text as="p" variant="bodySm" tone="subdued">Rewards Claimed</Text>
                          <Text as="p" variant="bodyMd" fontWeight="semibold">
                            {event.total_rewards_claimed}
                          </Text>
                        </BlockStack>
                      </InlineStack>

                      {event.max_participants && (
                        <BlockStack gap="100">
                          <InlineStack align="space-between">
                            <Text as="p" variant="bodySm">Capacity</Text>
                            <Text as="p" variant="bodySm" tone="subdued">
                              {progressPercentage.toFixed(0)}%
                            </Text>
                          </InlineStack>
                          <ProgressBar progress={progressPercentage / 100} />
                        </BlockStack>
                      )}
                    </BlockStack>
                  </Box>
                );
              })}
            </BlockStack>
          ) : (
            <Box padding="800">
              <BlockStack gap="400" align="center">
                <Text as="p" variant="bodyMd" tone="subdued">
                  No active events at the moment
                </Text>
                <Button variant="primary" onClick={() => router.push('/vip-events/new')}>
                  Create Your First Event
                </Button>
              </BlockStack>
            </Box>
          )}
        </BlockStack>
      </Card>

      {/* Quick Actions */}
      <Card>
        <BlockStack gap="400">
          <Text as="h2" variant="headingLg">Quick Actions</Text>
          <InlineStack gap="300">
            <Button onClick={() => router.push('/vip-events/new')}>
              Create New Event
            </Button>
            <Button variant="plain" onClick={() => router.push('/vip-events/templates')}>
              Browse Templates
            </Button>
            <Button variant="plain" onClick={() => router.push('/vip-events/analytics')}>
              View Analytics
            </Button>
          </InlineStack>
        </BlockStack>
      </Card>
    </BlockStack>
  );
} 