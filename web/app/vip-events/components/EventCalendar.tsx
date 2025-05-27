import React, { useState } from 'react';
import {
  BlockStack,
  InlineStack,
  Text,
  Box,
  Card,
  Badge,
  Button,
  Icon,
  Select,
  Grid
} from '@shopify/polaris';
import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@shopify/polaris-icons';
import { VIPEvent, EventStatus } from '../../types/events';
import { useRouter } from 'next/navigation';

interface EventCalendarProps {
  events: VIPEvent[];
  onRefresh: () => void;
}

export function EventCalendar({ events, onRefresh }: EventCalendarProps) {
  const router = useRouter();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Get month and year
  const monthYear = currentMonth.toLocaleDateString('en-US', { 
    month: 'long', 
    year: 'numeric' 
  });

  // Navigate months
  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  // Get events for current month
  const monthEvents = events.filter(event => {
    const eventStart = new Date(event.start_date);
    const eventEnd = new Date(event.end_date);
    const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    
    return (eventStart <= monthEnd && eventEnd >= monthStart);
  });

  // Group events by date
  const eventsByDate: Record<string, VIPEvent[]> = {};
  monthEvents.forEach(event => {
    const dateKey = new Date(event.start_date).toDateString();
    if (!eventsByDate[dateKey]) {
      eventsByDate[dateKey] = [];
    }
    eventsByDate[dateKey].push(event);
  });

  // Generate calendar days
  const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
  const startPadding = firstDay.getDay();
  const totalDays = lastDay.getDate();

  const calendarDays = [];
  for (let i = 0; i < startPadding; i++) {
    calendarDays.push(null);
  }
  for (let i = 1; i <= totalDays; i++) {
    calendarDays.push(i);
  }

  return (
    <BlockStack gap="600">
      <InlineStack align="space-between">
        <BlockStack gap="200">
          <Text as="h2" variant="headingLg">Event Calendar</Text>
          <Text as="p" variant="bodySm" tone="subdued">
            View all scheduled events in calendar format
          </Text>
        </BlockStack>
        <Button variant="primary" onClick={() => router.push('/vip-events/new')}>
          Create Event
        </Button>
      </InlineStack>

      <Card>
        <BlockStack gap="400">
          {/* Calendar Header */}
          <InlineStack align="space-between">
            <InlineStack gap="200">
              <Button icon={ChevronLeftIcon} onClick={previousMonth} />
              <Text as="h3" variant="headingMd">{monthYear}</Text>
              <Button icon={ChevronRightIcon} onClick={nextMonth} />
            </InlineStack>
            <Button onClick={onRefresh}>Refresh</Button>
          </InlineStack>

          {/* Calendar Grid */}
          <Box>
            <Grid columns={{ xs: 7, sm: 7, md: 7, lg: 7, xl: 7 }}>
              {/* Day headers */}
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <Grid.Cell key={day}>
                  <Box padding="200" background="bg-surface-secondary">
                    <Text as="p" variant="bodySm" fontWeight="semibold" alignment="center">
                      {day}
                    </Text>
                  </Box>
                </Grid.Cell>
              ))}

              {/* Calendar days */}
              {calendarDays.map((day, index) => {
                const dateObj = day ? new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day) : null;
                const dateKey = dateObj ? dateObj.toDateString() : '';
                const dayEvents = dateObj ? (eventsByDate[dateKey] || []) : [];

                return (
                  <Grid.Cell key={index}>
                    <Box
                      minHeight="80px"
                      padding="200"
                      borderColor="border"
                      borderWidth="025"
                    >
                      {day && (
                        <BlockStack gap="100">
                          <Text as="p" variant="bodySm">
                            {day}
                          </Text>
                          {dayEvents.slice(0, 2).map((event, idx) => (
                            <div
                              key={idx}
                              onClick={() => router.push(`/vip-events/${event.id}`)}
                              style={{ cursor: 'pointer' }}
                            >
                              <Box
                                padding="100"
                                background="bg-surface-info"
                                borderRadius="100"
                              >
                                <Text as="p" variant="bodySm" truncate>
                                  {event.icon} {event.name}
                                </Text>
                              </Box>
                            </div>
                          ))}
                          {dayEvents.length > 2 && (
                            <Text as="p" variant="bodySm" tone="subdued">
                              +{dayEvents.length - 2} more
                            </Text>
                          )}
                        </BlockStack>
                      )}
                    </Box>
                  </Grid.Cell>
                );
              })}
            </Grid>
          </Box>

          {/* Event List for Month */}
          <BlockStack gap="300">
            <Text as="h4" variant="headingSm">Events This Month ({monthEvents.length})</Text>
            {monthEvents.length > 0 ? (
              <BlockStack gap="200">
                {monthEvents.map(event => (
                  <div
                    key={event.id}
                    onClick={() => router.push(`/vip-events/${event.id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <Box
                      padding="300"
                      background="bg-surface-secondary"
                      borderRadius="200"
                    >
                      <InlineStack align="space-between">
                        <InlineStack gap="300" align="center">
                          <Text as="span" variant="headingMd">{event.icon}</Text>
                          <BlockStack gap="100">
                            <Text as="p" variant="bodyMd" fontWeight="semibold">
                              {event.name}
                            </Text>
                            <Text as="p" variant="bodySm" tone="subdued">
                              {new Date(event.start_date).toLocaleDateString()} - {new Date(event.end_date).toLocaleDateString()}
                            </Text>
                          </BlockStack>
                        </InlineStack>
                        <Badge tone={
                          event.status === EventStatus.ACTIVE ? 'success' :
                          event.status === EventStatus.SCHEDULED ? 'info' :
                          'new'
                        }>
                          {event.status}
                        </Badge>
                      </InlineStack>
                    </Box>
                  </div>
                ))}
              </BlockStack>
            ) : (
              <Text as="p" variant="bodyMd" tone="subdued">
                No events scheduled for this month
              </Text>
            )}
          </BlockStack>
        </BlockStack>
      </Card>
    </BlockStack>
  );
} 