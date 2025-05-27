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
  Divider
} from '@shopify/polaris';
import {
  CalendarIcon,
  PersonIcon,
  ChartVerticalIcon,
  EditIcon,
  DeleteIcon
} from '@shopify/polaris-icons';
import { VIPEvent, EventStatus } from '../../types/events';
import { useRouter } from 'next/navigation';

interface EventTimelineProps {
  events: VIPEvent[];
  onRefresh: () => void;
}

export function EventTimeline({ events, onRefresh }: EventTimelineProps) {
  const router = useRouter();

  // Sort events by date
  const sortedEvents = [...events].sort((a, b) => 
    new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
  );

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Format date range
  const formatDateRange = (start: string, end: string) => {
    return `${formatDate(start)} - ${formatDate(end)}`;
  };

  // Get status badge tone
  const getStatusTone = (status: EventStatus) => {
    switch (status) {
      case EventStatus.ACTIVE:
        return 'success';
      case EventStatus.SCHEDULED:
        return 'info';
      case EventStatus.DRAFT:
        return 'new';
      case EventStatus.COMPLETED:
        return 'success';
      default:
        return 'new';
    }
  };

  // Get month and day for timeline
  const getTimelineDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
    return { day, month };
  };

  return (
    <BlockStack gap="600">
      <InlineStack align="space-between">
        <BlockStack gap="200">
          <Text as="h2" variant="headingLg">VIP Event Timeline</Text>
          <Text as="p" variant="bodySm" tone="subdued">
            View and manage your scheduled loyalty events
          </Text>
        </BlockStack>
        <Button variant="primary" onClick={() => router.push('/vip-events/new')}>
          Create Event
        </Button>
      </InlineStack>

      {/* Upcoming Events Section */}
      <Card>
        <BlockStack gap="400">
          <InlineStack align="space-between">
            <InlineStack gap="200" align="center">
              <Icon source={CalendarIcon} tone="base" />
              <Text as="h3" variant="headingMd">Upcoming VIP Events</Text>
            </InlineStack>
          </InlineStack>

          <BlockStack gap="400">
            {sortedEvents.map((event, index) => {
              const { day, month } = getTimelineDate(event.start_date);
              
              return (
                <Box key={event.id}>
                  <InlineStack gap="400" align="start">
                    {/* Date Column */}
                    <Box minWidth="80px">
                      <BlockStack gap="100" align="center">
                        <Text as="p" variant="heading2xl" fontWeight="bold">
                          {day}
                        </Text>
                        <Text as="p" variant="bodySm" tone="subdued">
                          {month}
                        </Text>
                      </BlockStack>
                    </Box>

                    {/* Timeline Line */}
                    <Box>
                      <div style={{
                        width: '2px',
                        height: '100%',
                        background: index === sortedEvents.length - 1 ? 'transparent' : '#e1e3e5',
                        position: 'relative'
                      }}>
                        <div style={{
                          position: 'absolute',
                          top: '20px',
                          left: '-4px',
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          background: event.status === EventStatus.ACTIVE ? '#00a854' : '#6366f1',
                          border: '2px solid white',
                          boxShadow: '0 0 0 1px #e1e3e5'
                        }} />
                      </div>
                    </Box>

                    {/* Event Details */}
                    <Box width="100%">
                      <Card>
                        <BlockStack gap="300">
                          <InlineStack align="space-between">
                            <BlockStack gap="200">
                              <InlineStack gap="300" align="center">
                                <Text as="span" variant="headingLg">{event.icon}</Text>
                                <BlockStack gap="100">
                                  <InlineStack gap="200" align="center">
                                    <Text as="h4" variant="headingMd">{event.name}</Text>
                                    <Badge tone={getStatusTone(event.status)}>
                                      {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                                    </Badge>
                                  </InlineStack>
                                  <Text as="p" variant="bodySm" tone="subdued">
                                    {event.description}
                                  </Text>
                                </BlockStack>
                              </InlineStack>
                            </BlockStack>
                            
                            <InlineStack gap="200">
                              <Button
                                size="slim"
                                icon={EditIcon}
                                onClick={() => router.push(`/vip-events/${event.id}/edit`)}
                              >
                                Edit
                              </Button>
                              <Button
                                size="slim"
                                tone="critical"
                                icon={DeleteIcon}
                                onClick={() => console.log('Delete event', event.id)}
                              />
                            </InlineStack>
                          </InlineStack>

                          <Divider />

                          <InlineStack gap="400">
                            <BlockStack gap="100">
                              <Text as="p" variant="bodySm" tone="subdued">Duration</Text>
                              <Text as="p" variant="bodySm">
                                {formatDateRange(event.start_date, event.end_date)}
                              </Text>
                            </BlockStack>

                            <BlockStack gap="100">
                              <Text as="p" variant="bodySm" tone="subdued">Rewards</Text>
                              <InlineStack gap="200">
                                {event.rewards.map((reward, idx) => (
                                  <Badge key={idx}>
                                    {reward.type === 'points_multiplier' 
                                      ? `${reward.value}x Points`
                                      : reward.type === 'bonus_points'
                                      ? `+${reward.value} Points`
                                      : reward.description
                                    }
                                  </Badge>
                                ))}
                              </InlineStack>
                            </BlockStack>
                          </InlineStack>

                          <InlineStack gap="400" wrap>
                            {/* Target Tiers */}
                            {event.targets.filter(t => t.type === 'vip_tier').map((target, idx) => (
                              <InlineStack key={`tier-${idx}`} gap="200" align="center">
                                <Icon source={PersonIcon} tone="subdued" />
                                {target.values.map((tier, tidx) => (
                                  <Badge key={tidx} tone="info">{tier}</Badge>
                                ))}
                              </InlineStack>
                            ))}

                            {/* Target Segments */}
                            {event.targets.filter(t => t.type === 'ai_segment').map((target, idx) => (
                              <InlineStack key={`seg-${idx}`} gap="200" align="center">
                                <Icon source={ChartVerticalIcon} tone="subdued" />
                                {target.values.map((segment, sidx) => (
                                  <Badge key={sidx} tone="success">{segment}</Badge>
                                ))}
                              </InlineStack>
                            ))}
                          </InlineStack>

                          {event.status === EventStatus.ACTIVE && (
                            <Box background="bg-surface-success" padding="300" borderRadius="200">
                              <InlineStack align="space-between">
                                <Text as="p" variant="bodySm">
                                  <strong>{event.total_participants}</strong> participants
                                </Text>
                                <Text as="p" variant="bodySm">
                                  <strong>${event.total_revenue_generated.toLocaleString()}</strong> revenue
                                </Text>
                              </InlineStack>
                            </Box>
                          )}
                        </BlockStack>
                      </Card>
                    </Box>
                  </InlineStack>

                  {index < sortedEvents.length - 1 && (
                    <Box paddingBlockEnd="400" />
                  )}
                </Box>
              );
            })}
          </BlockStack>
        </BlockStack>
      </Card>
    </BlockStack>
  );
} 