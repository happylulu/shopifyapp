"use client";

import React from 'react';
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
  TextField,
  DataTable,
  Modal,
  FormLayout,
  Select,
  EmptyState,
  Divider,
  Box
} from '@shopify/polaris';

export default function CustomerLookupPage() {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [searchResults, setSearchResults] = React.useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = React.useState<any>(null);
  const [modalActive, setModalActive] = React.useState(false);
  const [adjustmentModalActive, setAdjustmentModalActive] = React.useState(false);
  const [pointsAdjustment, setPointsAdjustment] = React.useState('');
  const [adjustmentReason, setAdjustmentReason] = React.useState('');
  const [searching, setSearching] = React.useState(false);

  // Mock customer data
  const mockCustomers = [
    {
      id: '1',
      email: 'john.doe@example.com',
      firstName: 'John',
      lastName: 'Doe',
      phone: '+1234567890',
      currentPoints: 1250,
      totalPointsEarned: 3450,
      totalPointsRedeemed: 2200,
      currentTier: 'Gold',
      nextTier: 'Platinum',
      pointsToNextTier: 3750,
      joinDate: '2023-06-15',
      lastActivity: '2024-01-15',
      totalOrders: 12,
      totalSpent: 1450.75,
      averageOrderValue: 120.90,
      redemptionHistory: [
        { date: '2024-01-10', reward: '10% Discount', points: 500, orderId: '#1001' },
        { date: '2024-01-05', reward: 'Free Shipping', points: 200, orderId: '#1002' },
        { date: '2023-12-20', reward: '$5 Store Credit', points: 1000, orderId: '#1003' },
      ],
      pointsHistory: [
        { date: '2024-01-15', type: 'earned', points: 150, reason: 'Order #1004' },
        { date: '2024-01-10', type: 'redeemed', points: -500, reason: '10% Discount' },
        { date: '2024-01-05', type: 'redeemed', points: -200, reason: 'Free Shipping' },
        { date: '2024-01-01', type: 'earned', points: 100, reason: 'Order #1005' },
      ],
    },
    {
      id: '2',
      email: 'jane.smith@example.com',
      firstName: 'Jane',
      lastName: 'Smith',
      phone: '+1987654321',
      currentPoints: 750,
      totalPointsEarned: 1200,
      totalPointsRedeemed: 450,
      currentTier: 'Silver',
      nextTier: 'Gold',
      pointsToNextTier: 750,
      joinDate: '2023-08-20',
      lastActivity: '2024-01-12',
      totalOrders: 8,
      totalSpent: 890.50,
      averageOrderValue: 111.31,
      redemptionHistory: [
        { date: '2024-01-08', reward: 'Free Shipping', points: 200, orderId: '#2001' },
        { date: '2023-12-15', reward: '10% Discount', points: 250, orderId: '#2002' },
      ],
      pointsHistory: [
        { date: '2024-01-12', type: 'earned', points: 120, reason: 'Order #2003' },
        { date: '2024-01-08', type: 'redeemed', points: -200, reason: 'Free Shipping' },
        { date: '2024-01-01', type: 'earned', points: 80, reason: 'Order #2004' },
      ],
    },
  ];

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setSearching(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const results = mockCustomers.filter(customer => 
      customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone.includes(searchQuery)
    );
    
    setSearchResults(results);
    setSearching(false);
  };

  const handleViewCustomer = (customer: any) => {
    setSelectedCustomer(customer);
    setModalActive(true);
  };

  const handleAdjustPoints = () => {
    setAdjustmentModalActive(true);
  };

  const handleSaveAdjustment = () => {
    alert(`Adjusted ${selectedCustomer?.firstName}'s points by ${pointsAdjustment} (${adjustmentReason})`);
    setAdjustmentModalActive(false);
    setPointsAdjustment('');
    setAdjustmentReason('');
  };

  const searchResultRows = searchResults.map((customer) => [
    `${customer.firstName} ${customer.lastName}`,
    customer.email,
    customer.phone,
    customer.currentPoints.toLocaleString(),
    <Badge key={customer.id} tone="info">{customer.currentTier}</Badge>,
    customer.lastActivity,
    <Button key={customer.id} size="slim" onClick={() => handleViewCustomer(customer)}>
      View Details
    </Button>,
  ]);

  const customerModal = selectedCustomer && (
    <Modal
      open={modalActive}
      onClose={() => setModalActive(false)}
      title={`${selectedCustomer.firstName} ${selectedCustomer.lastName}`}
      primaryAction={{
        content: 'Adjust Points',
        onAction: handleAdjustPoints,
      }}
      secondaryActions={[
        {
          content: 'Close',
          onAction: () => setModalActive(false),
        },
      ]}
      large
    >
      <Modal.Section>
        <Layout>
          <Layout.Section>
            <InlineStack gap="400">
              <Card>
                <BlockStack gap="300">
                  <Text variant="headingMd" as="h3">Customer Info</Text>
                  <Text><strong>Email:</strong> {selectedCustomer.email}</Text>
                  <Text><strong>Phone:</strong> {selectedCustomer.phone}</Text>
                  <Text><strong>Join Date:</strong> {selectedCustomer.joinDate}</Text>
                  <Text><strong>Last Activity:</strong> {selectedCustomer.lastActivity}</Text>
                </BlockStack>
              </Card>

              <Card>
                <BlockStack gap="300">
                  <Text variant="headingMd" as="h3">Loyalty Status</Text>
                  <Text><strong>Current Tier:</strong> <Badge tone="info">{selectedCustomer.currentTier}</Badge></Text>
                  <Text><strong>Current Points:</strong> {selectedCustomer.currentPoints.toLocaleString()}</Text>
                  <Text><strong>Points to {selectedCustomer.nextTier}:</strong> {selectedCustomer.pointsToNextTier.toLocaleString()}</Text>
                  <Text><strong>Total Earned:</strong> {selectedCustomer.totalPointsEarned.toLocaleString()}</Text>
                  <Text><strong>Total Redeemed:</strong> {selectedCustomer.totalPointsRedeemed.toLocaleString()}</Text>
                </BlockStack>
              </Card>

              <Card>
                <BlockStack gap="300">
                  <Text variant="headingMd" as="h3">Purchase History</Text>
                  <Text><strong>Total Orders:</strong> {selectedCustomer.totalOrders}</Text>
                  <Text><strong>Total Spent:</strong> ${selectedCustomer.totalSpent.toLocaleString()}</Text>
                  <Text><strong>Avg Order Value:</strong> ${selectedCustomer.averageOrderValue}</Text>
                </BlockStack>
              </Card>
            </InlineStack>
          </Layout.Section>

          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text variant="headingMd" as="h3">Recent Points Activity</Text>
                <DataTable
                  columnContentTypes={['text', 'text', 'numeric', 'text']}
                  headings={['Date', 'Type', 'Points', 'Reason']}
                  rows={selectedCustomer.pointsHistory.map((activity: any) => [
                    activity.date,
                    <Badge key={activity.date} tone={activity.type === 'earned' ? 'success' : 'attention'}>
                      {activity.type}
                    </Badge>,
                    activity.points > 0 ? `+${activity.points}` : activity.points.toString(),
                    activity.reason,
                  ])}
                />
              </BlockStack>
            </Card>
          </Layout.Section>

          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text variant="headingMd" as="h3">Redemption History</Text>
                <DataTable
                  columnContentTypes={['text', 'text', 'numeric', 'text']}
                  headings={['Date', 'Reward', 'Points Used', 'Order']}
                  rows={selectedCustomer.redemptionHistory.map((redemption: any) => [
                    redemption.date,
                    redemption.reward,
                    redemption.points.toLocaleString(),
                    redemption.orderId,
                  ])}
                />
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </Modal.Section>
    </Modal>
  );

  const adjustmentModal = (
    <Modal
      open={adjustmentModalActive}
      onClose={() => setAdjustmentModalActive(false)}
      title="Adjust Customer Points"
      primaryAction={{
        content: 'Apply Adjustment',
        onAction: handleSaveAdjustment,
        disabled: !pointsAdjustment || !adjustmentReason,
      }}
      secondaryActions={[
        {
          content: 'Cancel',
          onAction: () => setAdjustmentModalActive(false),
        },
      ]}
    >
      <Modal.Section>
        <FormLayout>
          <TextField
            label="Points Adjustment"
            type="number"
            value={pointsAdjustment}
            onChange={setPointsAdjustment}
            placeholder="Enter positive or negative number"
            helpText="Use positive numbers to add points, negative to subtract"
            autoComplete="off"
          />

          <TextField
            label="Reason for Adjustment"
            value={adjustmentReason}
            onChange={setAdjustmentReason}
            placeholder="e.g., Customer service compensation, Error correction"
            autoComplete="off"
          />

          <Banner tone="warning">
            <Text as="p">
              Point adjustments will be logged and visible in the customer's activity history.
            </Text>
          </Banner>
        </FormLayout>
      </Modal.Section>
    </Modal>
  );

  return (
    <Page
      title="Customer Lookup"
      subtitle="Search and manage customer loyalty accounts"
      secondaryActions={[
        {
          content: 'Back to Dashboard',
          url: '/admin-working',
        },
      ]}
    >
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h3">Search Customers</Text>
              
              <InlineStack gap="300">
                <Box width="70%">
                  <TextField
                    label="Search"
                    labelHidden
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder="Search by email, name, or phone number"
                    autoComplete="off"
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </Box>
                <Button 
                  variant="primary" 
                  onClick={handleSearch}
                  loading={searching}
                  disabled={!searchQuery.trim()}
                >
                  Search
                </Button>
              </InlineStack>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h3">Search Results</Text>
              
              {searchResults.length > 0 ? (
                <DataTable
                  columnContentTypes={['text', 'text', 'text', 'numeric', 'text', 'text', 'text']}
                  headings={['Name', 'Email', 'Phone', 'Points', 'Tier', 'Last Activity', 'Actions']}
                  rows={searchResultRows}
                />
              ) : searchQuery && !searching ? (
                <EmptyState
                  heading="No customers found"
                  image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                >
                  <Text as="p">
                    Try searching with a different email, name, or phone number.
                  </Text>
                </EmptyState>
              ) : (
                <EmptyState
                  heading="Search for customers"
                  image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                >
                  <Text as="p">
                    Enter a customer's email, name, or phone number to find their loyalty account.
                  </Text>
                </EmptyState>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Quick Actions */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h3">Quick Actions</Text>
              
              <InlineStack gap="300">
                <Button onClick={() => alert('Bulk import coming soon')}>
                  Bulk Import Customers
                </Button>
                <Button onClick={() => alert('Export customer data coming soon')}>
                  Export Customer Data
                </Button>
                <Button onClick={() => alert('Member segments coming soon')}>
                  View Member Segments
                </Button>
              </InlineStack>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>

      {customerModal}
      {adjustmentModal}
    </Page>
  );
}
