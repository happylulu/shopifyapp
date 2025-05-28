"use client";

import React, { useState, useMemo } from 'react';
import {
  Page,
  Layout,
  Card,
  BlockStack,
  InlineStack,
  Text,
  Badge,
  Button,
  Banner,
  DataTable,
  TextField,
  Select,
  Filters,
  ChoiceList,
  RangeSlider,
  Pagination,
  Tooltip,
  ProgressBar,
  Avatar,
  ButtonGroup,
  Popover,
  ActionList,
  Modal,
  Spinner,
  EmptyState,
  Divider
} from '@shopify/polaris';
import {
  SearchIcon,
  ExportIcon,
  FilterIcon,
  ChevronDownIcon,
  StarFilledIcon,
  EmailIcon,
  PhoneIcon
} from '@shopify/polaris-icons';
import { useQuery } from '@tanstack/react-query';
import { useShopifyCustomers, useCustomerAnalytics } from '../../lib/hooks/useShopifyCustomers';

// Mock enhanced customer data (replace with real Shopify GraphQL)
const mockEnhancedCustomers = [
  {
    id: 'gid://shopify/Customer/1',
    email: 'lisa.smith@example.com',
    firstName: 'Lisa',
    lastName: 'Smith',
    phone: '+1-555-0123',
    createdAt: '2023-01-15T10:30:00Z',
    totalSpent: '0.00',
    ordersCount: 0,
    loyaltyPoints: 0,
    loyaltyTier: 'Bronze',
    pointsToNextTier: 500,
    lifetimeValue: 0,
    engagementScore: 15,
    riskLevel: 'medium' as const,
    location: { city: 'Clinton', province: 'FL', country: 'United States' },
    recommendations: ['Send welcome series', 'Offer first-purchase discount'],
    lastOrder: null,
  },
  {
    id: 'gid://shopify/Customer/2',
    email: 'betty.young@example.com',
    firstName: 'Betty',
    lastName: 'Young',
    phone: '+1-555-0124',
    createdAt: '2023-02-20T14:15:00Z',
    totalSpent: '1025.00',
    ordersCount: 1,
    loyaltyPoints: 1025,
    loyaltyTier: 'Silver',
    pointsToNextTier: 475,
    lifetimeValue: 1230,
    engagementScore: 75,
    riskLevel: 'low' as const,
    location: { city: 'Clinton', province: 'CA', country: 'United States' },
    recommendations: ['Encourage second purchase', 'Upsell premium products'],
    lastOrder: {
      id: 'order_1',
      name: '#1001',
      createdAt: '2023-02-20T14:15:00Z',
      totalPrice: '1025.00',
    },
  },
  {
    id: 'gid://shopify/Customer/3',
    email: 'ayumu.hirano@example.com',
    firstName: 'Ayumu',
    lastName: 'Hirano',
    phone: null,
    createdAt: '2023-03-10T09:45:00Z',
    totalSpent: '600.00',
    ordersCount: 1,
    loyaltyPoints: 600,
    loyaltyTier: 'Silver',
    pointsToNextTier: 900,
    lifetimeValue: 720,
    engagementScore: 65,
    riskLevel: 'low' as const,
    location: { city: 'Ottawa', province: 'ON', country: 'Canada' },
    recommendations: ['Encourage repeat purchase', 'Cross-sell related items'],
    lastOrder: {
      id: 'order_2',
      name: '#1002',
      createdAt: '2023-03-10T09:45:00Z',
      totalPrice: '600.00',
    },
  },
];

// Use real Shopify data instead of mock data
function useCustomersData() {
  const { data: customers = [], isLoading, error, refetch } = useShopifyCustomers({ first: 50 });

  return {
    data: customers && customers.length > 0 ? customers : mockEnhancedCustomers, // Fallback to mock if no real data
    isLoading,
    error,
    refetch,
  };
}

export default function AdminProPage() {
  const { data: customers = [], isLoading, error, refetch } = useCustomersData();
  const { analytics: realAnalytics, isLoading: analyticsLoading } = useCustomerAnalytics();

  // Filters and search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTiers, setSelectedTiers] = useState<string[]>([]);
  const [selectedRiskLevels, setSelectedRiskLevels] = useState<string[]>([]);
  const [spentRange, setSpentRange] = useState<[number, number]>([0, 5000]);
  const [sortBy, setSortBy] = useState('lifetimeValue');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // UI state
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [bulkActionPopover, setBulkActionPopover] = useState(false);
  const [customerDetailModal, setCustomerDetailModal] = useState<string | null>(null);

  // Filter and sort customers
  const filteredCustomers = useMemo(() => {
    let filtered = customers.filter(customer => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const searchableText = `${customer.firstName} ${customer.lastName} ${customer.email}`.toLowerCase();
        if (!searchableText.includes(query)) return false;
      }

      // Tier filter
      if (selectedTiers.length > 0 && !selectedTiers.includes(customer.loyaltyTier)) {
        return false;
      }

      // Risk level filter
      if (selectedRiskLevels.length > 0 && !selectedRiskLevels.includes(customer.riskLevel)) {
        return false;
      }

      // Spent range filter
      const spent = parseFloat(customer.totalSpent);
      if (spent < spentRange[0] || spent > spentRange[1]) {
        return false;
      }

      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      let aValue: any = a[sortBy as keyof typeof a];
      let bValue: any = b[sortBy as keyof typeof b];

      if (typeof aValue === 'string' && !isNaN(parseFloat(aValue))) {
        aValue = parseFloat(aValue);
        bValue = parseFloat(bValue);
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [customers, searchQuery, selectedTiers, selectedRiskLevels, spentRange, sortBy, sortDirection]);

  // Use real analytics if available, otherwise calculate from current data
  const analytics = useMemo(() => {
    if (realAnalytics && !analyticsLoading) {
      return realAnalytics;
    }

    // Fallback calculation from current customer data
    const totalCustomers = customers.length;
    const totalRevenue = customers.reduce((sum, c) => sum + parseFloat(c.totalSpent), 0);
    const avgLifetimeValue = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;
    const highValueCustomers = customers.filter(c => parseFloat(c.totalSpent) > 1000).length;
    const atRiskCustomers = customers.filter(c => c.riskLevel === 'high').length;

    return {
      totalCustomers,
      totalRevenue,
      avgLifetimeValue,
      highValueCustomers,
      atRiskCustomers,
      conversionRate: totalCustomers > 0 ? (customers.filter(c => c.ordersCount > 0).length / totalCustomers) * 100 : 0,
    };
  }, [customers, realAnalytics, analyticsLoading]);

  if (isLoading) {
    return (
      <Page title="Loading Customer Intelligence...">
        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="400" align="center">
                <Spinner size="large" />
                <Text variant="bodyMd">Loading real customer data...</Text>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  if (error) {
    return (
      <Page title="Customer Intelligence">
        <Layout>
          <Layout.Section>
            <Banner tone="critical">
              <Text as="p">Failed to load customer data. Please try again.</Text>
            </Banner>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  return (
    <Page
      title="🧠 Customer Intelligence"
      subtitle={`${analytics.totalCustomers} customers • $${analytics.totalRevenue.toLocaleString()} total revenue`}
      primaryAction={{
        content: 'Export Insights',
        icon: ExportIcon,
        onAction: () => alert('Export functionality coming soon'),
      }}
      secondaryActions={[
        {
          content: 'Refresh Data',
          onAction: () => refetch(),
        },
        {
          content: 'Campaign Builder',
          onAction: () => alert('Campaign builder coming soon'),
        },
      ]}
    >
      <Layout>
        {/* Key Metrics */}
        <Layout.Section>
          <InlineStack gap="400" wrap={false}>
            <Card>
              <BlockStack gap="200">
                <InlineStack align="space-between">
                  <Text variant="headingMd" as="h3">Total Revenue</Text>
                  <Text variant="bodyMd">📈</Text>
                </InlineStack>
                <Text variant="heading2xl" as="p" tone="success">
                  ${analytics.totalRevenue.toLocaleString()}
                </Text>
                <Text variant="bodySm" tone="subdued">
                  Avg LTV: ${analytics.avgLifetimeValue.toFixed(0)}
                </Text>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="200">
                <InlineStack align="space-between">
                  <Text variant="headingMd" as="h3">High-Value Customers</Text>
                  <StarFilledIcon />
                </InlineStack>
                <Text variant="heading2xl" as="p" tone="success">
                  {analytics.highValueCustomers}
                </Text>
                <Text variant="bodySm" tone="subdued">
                  {((analytics.highValueCustomers / analytics.totalCustomers) * 100).toFixed(1)}% of total
                </Text>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="200">
                <InlineStack align="space-between">
                  <Text variant="headingMd" as="h3">At-Risk Customers</Text>
                  <Text variant="bodyMd">⚠️</Text>
                </InlineStack>
                <Text variant="heading2xl" as="p" tone="critical">
                  {analytics.atRiskCustomers}
                </Text>
                <Text variant="bodySm" tone="subdued">
                  Need immediate attention
                </Text>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="200">
                <InlineStack align="space-between">
                  <Text variant="headingMd" as="h3">Conversion Rate</Text>
                  <Text variant="bodyMd">📊</Text>
                </InlineStack>
                <Text variant="heading2xl" as="p" tone="success">
                  {analytics.conversionRate.toFixed(1)}%
                </Text>
                <Text variant="bodySm" tone="subdued">
                  Visitors to customers
                </Text>
              </BlockStack>
            </Card>
          </InlineStack>
        </Layout.Section>

        {/* Search and Filters */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <InlineStack gap="300" align="space-between">
                <div style={{ flexGrow: 1, maxWidth: '400px' }}>
                  <TextField
                    label=""
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder="Search customers by name or email..."
                    prefix={<SearchIcon />}
                    autoComplete="off"
                  />
                </div>

                <ButtonGroup>
                  <Button
                    icon={FilterIcon}
                    onClick={() => setShowFilters(!showFilters)}
                    pressed={showFilters}
                  >
                    Filters
                  </Button>

                  {selectedCustomers.length > 0 && (
                    <Popover
                      active={bulkActionPopover}
                      activator={
                        <Button
                          onClick={() => setBulkActionPopover(!bulkActionPopover)}
                          disclosure="down"
                        >
                          {selectedCustomers.length} selected
                        </Button>
                      }
                      onClose={() => setBulkActionPopover(false)}
                    >
                      <ActionList
                        items={[
                          {
                            content: 'Send email campaign',
                            onAction: () => alert('Email campaign feature coming soon'),
                          },
                          {
                            content: 'Add to segment',
                            onAction: () => alert('Segmentation feature coming soon'),
                          },
                          {
                            content: 'Export selected',
                            onAction: () => alert('Export feature coming soon'),
                          },
                        ]}
                      />
                    </Popover>
                  )}
                </ButtonGroup>
              </InlineStack>

              {showFilters && (
                <Card background="bg-surface-secondary">
                  <BlockStack gap="400">
                    <Text variant="headingMd" as="h4">Advanced Filters</Text>

                    <InlineStack gap="400" wrap>
                      <div style={{ minWidth: '200px' }}>
                        <ChoiceList
                          title="Loyalty Tier"
                          choices={[
                            { label: 'Bronze', value: 'Bronze' },
                            { label: 'Silver', value: 'Silver' },
                            { label: 'Gold', value: 'Gold' },
                            { label: 'Platinum', value: 'Platinum' },
                          ]}
                          selected={selectedTiers}
                          onChange={setSelectedTiers}
                          allowMultiple
                        />
                      </div>

                      <div style={{ minWidth: '200px' }}>
                        <ChoiceList
                          title="Risk Level"
                          choices={[
                            { label: 'Low Risk', value: 'low' },
                            { label: 'Medium Risk', value: 'medium' },
                            { label: 'High Risk', value: 'high' },
                          ]}
                          selected={selectedRiskLevels}
                          onChange={setSelectedRiskLevels}
                          allowMultiple
                        />
                      </div>

                      <div style={{ minWidth: '300px' }}>
                        <Text variant="bodyMd" as="p">Total Spent Range</Text>
                        <RangeSlider
                          label="Total spent"
                          value={spentRange}
                          onChange={setSpentRange}
                          output
                          min={0}
                          max={5000}
                          step={50}
                          prefix="$"
                        />
                      </div>
                    </InlineStack>
                  </BlockStack>
                </Card>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Customer Table */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <InlineStack align="space-between">
                <Text variant="headingMd" as="h3">
                  Customer Intelligence ({filteredCustomers.length} customers)
                </Text>

                <Select
                  label=""
                  options={[
                    { label: 'Sort by Lifetime Value', value: 'lifetimeValue' },
                    { label: 'Sort by Total Spent', value: 'totalSpent' },
                    { label: 'Sort by Engagement Score', value: 'engagementScore' },
                    { label: 'Sort by Join Date', value: 'createdAt' },
                    { label: 'Sort by Last Order', value: 'lastOrder' },
                  ]}
                  value={sortBy}
                  onChange={(value) => setSortBy(value)}
                />
              </InlineStack>

              {filteredCustomers.length === 0 ? (
                <EmptyState
                  heading="No customers found"
                  image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                >
                  <Text as="p">Try adjusting your search or filter criteria.</Text>
                </EmptyState>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  {filteredCustomers.map((customer) => (
                    <Card key={customer.id} padding="400">
                      <InlineStack align="space-between" gap="400">
                        {/* Customer Info */}
                        <InlineStack gap="300" align="center">
                          <input
                            type="checkbox"
                            checked={selectedCustomers.includes(customer.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedCustomers([...selectedCustomers, customer.id]);
                              } else {
                                setSelectedCustomers(selectedCustomers.filter(id => id !== customer.id));
                              }
                            }}
                          />

                          <Avatar
                            customer
                            size="medium"
                            name={`${customer.firstName} ${customer.lastName}`}
                          />

                          <BlockStack gap="100">
                            <Text variant="bodyMd" as="p" fontWeight="semibold">
                              {customer.firstName} {customer.lastName}
                            </Text>
                            <Text variant="bodySm" tone="subdued">
                              {customer.email}
                            </Text>
                            {customer.phone && (
                              <InlineStack gap="100" align="center">
                                <PhoneIcon />
                                <Text variant="bodySm" tone="subdued">
                                  {customer.phone}
                                </Text>
                              </InlineStack>
                            )}
                          </BlockStack>
                        </InlineStack>

                        {/* Loyalty Info */}
                        <BlockStack gap="100" align="center">
                          <Badge tone={
                            customer.loyaltyTier === 'Platinum' ? 'info' :
                            customer.loyaltyTier === 'Gold' ? 'warning' :
                            customer.loyaltyTier === 'Silver' ? 'success' : 'subdued'
                          }>
                            {customer.loyaltyTier}
                          </Badge>
                          <Text variant="bodySm" tone="subdued">
                            {customer.loyaltyPoints.toLocaleString()} points
                          </Text>
                          {customer.pointsToNextTier > 0 && (
                            <Text variant="bodySm" tone="subdued">
                              {customer.pointsToNextTier} to next tier
                            </Text>
                          )}
                        </BlockStack>

                        {/* Engagement */}
                        <BlockStack gap="100" align="center">
                          <Text variant="bodySm" fontWeight="semibold">
                            Engagement: {customer.engagementScore}%
                          </Text>
                          <ProgressBar
                            progress={customer.engagementScore}
                            size="small"
                            tone={customer.engagementScore > 70 ? 'success' : customer.engagementScore > 40 ? 'warning' : 'critical'}
                          />
                          <Badge tone={
                            customer.riskLevel === 'low' ? 'success' :
                            customer.riskLevel === 'medium' ? 'warning' : 'critical'
                          }>
                            {customer.riskLevel} risk
                          </Badge>
                        </BlockStack>

                        {/* Financial */}
                        <BlockStack gap="100" align="end">
                          <Text variant="bodyMd" fontWeight="semibold">
                            ${parseFloat(customer.totalSpent).toLocaleString()}
                          </Text>
                          <Text variant="bodySm" tone="subdued">
                            {customer.ordersCount} orders
                          </Text>
                          <Text variant="bodySm" tone="subdued">
                            LTV: ${customer.lifetimeValue.toLocaleString()}
                          </Text>
                        </BlockStack>

                        {/* Actions */}
                        <ButtonGroup>
                          <Button
                            size="slim"
                            onClick={() => setCustomerDetailModal(customer.id)}
                          >
                            View Details
                          </Button>
                          <Button
                            size="slim"
                            icon={EmailIcon}
                            onClick={() => alert('Email feature coming soon')}
                          >
                            Email
                          </Button>
                        </ButtonGroup>
                      </InlineStack>

                      {/* Recommendations */}
                      {customer.recommendations.length > 0 && (
                        <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e1e3e5' }}>
                          <InlineStack gap="200" wrap>
                            <Text variant="bodySm" fontWeight="semibold">Recommendations:</Text>
                            {customer.recommendations.map((rec, index) => (
                              <Badge key={index} tone="info" size="small">
                                {rec}
                              </Badge>
                            ))}
                          </InlineStack>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
