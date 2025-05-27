import React, { useState } from 'react';
import {
  BlockStack,
  InlineStack,
  Text,
  Box,
  Card,
  Badge,
  Button,
  DataTable,
  Filters,
  ChoiceList,
  TextField
} from '@shopify/polaris';
import {
  SearchIcon,
  EditIcon,
  DeleteIcon
} from '@shopify/polaris-icons';
import { VIPEvent, EventStatus } from '../../types/events';
import { useRouter } from 'next/navigation';

interface AllEventsProps {
  events: VIPEvent[];
  onRefresh: () => void;
}

export function AllEvents({ events, onRefresh }: AllEventsProps) {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [sortValue, setSortValue] = useState('date_desc');

  // Filter events
  const filteredEvents = events.filter(event => {
    const matchesSearch = searchValue === '' || 
      event.name.toLowerCase().includes(searchValue.toLowerCase()) ||
      event.description.toLowerCase().includes(searchValue.toLowerCase());
    
    const matchesStatus = statusFilter.length === 0 || 
      statusFilter.includes(event.status);
    
    return matchesSearch && matchesStatus;
  });

  // Sort events
  const sortedEvents = [...filteredEvents].sort((a, b) => {
    switch (sortValue) {
      case 'date_desc':
        return new Date(b.start_date).getTime() - new Date(a.start_date).getTime();
      case 'date_asc':
        return new Date(a.start_date).getTime() - new Date(b.start_date).getTime();
      case 'participants':
        return b.total_participants - a.total_participants;
      case 'revenue':
        return b.total_revenue_generated - a.total_revenue_generated;
      default:
        return 0;
    }
  });

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
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
      case EventStatus.CANCELLED:
        return 'critical';
      default:
        return 'new';
    }
  };

  // Table rows
  const rows = sortedEvents.map(event => [
    // Event Name & Icon
    <InlineStack gap="300" align="center" key={`${event.id}-name`}>
      <Text as="span" variant="headingMd">{event.icon}</Text>
      <BlockStack gap="100">
        <Text as="span" variant="bodyMd" fontWeight="semibold">
          {event.name}
        </Text>
        <Text as="span" variant="bodySm" tone="subdued">
          {event.description}
        </Text>
      </BlockStack>
    </InlineStack>,
    
    // Status
    <Badge key={`${event.id}-status`} tone={getStatusTone(event.status)}>
      {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
    </Badge>,
    
    // Date Range
    <Text as="span" variant="bodySm" key={`${event.id}-dates`}>
      {formatDate(event.start_date)} - {formatDate(event.end_date)}
    </Text>,
    
    // Targets
    <InlineStack gap="200" wrap key={`${event.id}-targets`}>
      {event.targets.slice(0, 2).map((target, idx) => (
        <Badge key={idx} tone="info">
          {target.values[0]}
        </Badge>
      ))}
      {event.targets.length > 2 && (
        <Text as="span" variant="bodySm" tone="subdued">
          +{event.targets.length - 2}
        </Text>
      )}
    </InlineStack>,
    
    // Participants
    <Text as="span" variant="bodyMd" key={`${event.id}-participants`}>
      {event.total_participants.toLocaleString()}
    </Text>,
    
    // Revenue
    <Text as="span" variant="bodyMd" fontWeight="semibold" key={`${event.id}-revenue`}>
      ${event.total_revenue_generated.toLocaleString()}
    </Text>,
    
    // Actions
    <InlineStack gap="200" key={`${event.id}-actions`}>
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
  ]);

  return (
    <BlockStack gap="600">
      <InlineStack align="space-between">
        <BlockStack gap="200">
          <Text as="h2" variant="headingLg">All Events</Text>
          <Text as="p" variant="bodySm" tone="subdued">
            Manage and track all your VIP events
          </Text>
        </BlockStack>
        <InlineStack gap="300">
          <Button onClick={onRefresh}>Refresh</Button>
          <Button variant="primary" onClick={() => router.push('/vip-events/new')}>
            Create Event
          </Button>
        </InlineStack>
      </InlineStack>

      {/* Filters */}
      <Card>
        <BlockStack gap="400">
          <Filters
            queryValue={searchValue}
            filters={[
              {
                key: 'status',
                label: 'Status',
                filter: (
                  <ChoiceList
                    title="Status"
                    titleHidden
                    choices={[
                      { label: 'Active', value: EventStatus.ACTIVE },
                      { label: 'Scheduled', value: EventStatus.SCHEDULED },
                      { label: 'Draft', value: EventStatus.DRAFT },
                      { label: 'Completed', value: EventStatus.COMPLETED }
                    ]}
                    selected={statusFilter}
                    onChange={setStatusFilter}
                    allowMultiple
                  />
                ),
                shortcut: true
              }
            ]}
            appliedFilters={statusFilter.map(status => ({
              key: status,
              label: status.charAt(0).toUpperCase() + status.slice(1),
              onRemove: () => setStatusFilter(statusFilter.filter(s => s !== status))
            }))}
            onQueryChange={setSearchValue}
            onQueryClear={() => setSearchValue('')}
            onClearAll={() => {
              setSearchValue('');
              setStatusFilter([]);
            }}
          />
        </BlockStack>
      </Card>

      {/* Events Table */}
      <Card>
        <DataTable
          columnContentTypes={['text', 'text', 'text', 'text', 'numeric', 'numeric', 'text']}
          headings={[
            'Event',
            'Status',
            'Date Range',
            'Targets',
            'Participants',
            'Revenue',
            'Actions'
          ]}
          rows={rows}
          totals={[
            '',
            '',
            '',
            '',
            sortedEvents.reduce((sum, e) => sum + e.total_participants, 0).toLocaleString(),
            `$${sortedEvents.reduce((sum, e) => sum + e.total_revenue_generated, 0).toLocaleString()}`,
            ''
          ]}
          showTotalsInFooter
        />
      </Card>

      {/* Summary Stats */}
      <Box background="bg-surface-secondary" padding="400" borderRadius="200">
        <InlineStack align="space-between">
          <BlockStack gap="100">
            <Text as="h3" variant="headingSm">Total Events</Text>
            <Text as="p" variant="headingMd" fontWeight="bold">
              {events.length}
            </Text>
          </BlockStack>
          
          <BlockStack gap="100">
            <Text as="h3" variant="headingSm">Total Participants</Text>
            <Text as="p" variant="headingMd" fontWeight="bold">
              {events.reduce((sum, e) => sum + e.total_participants, 0).toLocaleString()}
            </Text>
          </BlockStack>
          
          <BlockStack gap="100">
            <Text as="h3" variant="headingSm">Total Revenue</Text>
            <Text as="p" variant="headingMd" fontWeight="bold">
              ${events.reduce((sum, e) => sum + e.total_revenue_generated, 0).toLocaleString()}
            </Text>
          </BlockStack>
          
          <BlockStack gap="100">
            <Text as="h3" variant="headingSm">Avg Revenue/Event</Text>
            <Text as="p" variant="headingMd" fontWeight="bold">
              ${events.length > 0 ? (events.reduce((sum, e) => sum + e.total_revenue_generated, 0) / events.length).toFixed(0) : '0'}
            </Text>
          </BlockStack>
        </InlineStack>
      </Box>
    </BlockStack>
  );
} 