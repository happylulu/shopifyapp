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
  DataTable,
  Modal,
  TextField,
  FormLayout,
  Select
} from '@shopify/polaris';

export default function TierManagementPage() {
  const [modalActive, setModalActive] = React.useState(false);
  const [editingTier, setEditingTier] = React.useState<any>(null);
  const [formData, setFormData] = React.useState({
    name: '',
    minPoints: '',
    description: '',
    benefits: '',
  });

  // Mock tier data
  const tiers = [
    {
      id: '1',
      name: 'Bronze',
      level: 1,
      minPoints: 0,
      description: 'Welcome tier for new members',
      benefits: ['1x points on purchases', 'Birthday discount'],
      memberCount: 623,
      isActive: true,
    },
    {
      id: '2',
      name: 'Silver',
      level: 2,
      minPoints: 500,
      description: 'Tier for regular customers',
      benefits: ['1.2x points on purchases', 'Free shipping', 'Early access'],
      memberCount: 374,
      isActive: true,
    },
    {
      id: '3',
      name: 'Gold',
      level: 3,
      minPoints: 1500,
      description: 'Premium tier for loyal customers',
      benefits: ['1.5x points on purchases', 'Free shipping', 'Priority support'],
      memberCount: 187,
      isActive: true,
    },
    {
      id: '4',
      name: 'Platinum',
      level: 4,
      minPoints: 5000,
      description: 'VIP tier for top customers',
      benefits: ['2x points on purchases', 'Free shipping', 'VIP events'],
      memberCount: 63,
      isActive: true,
    },
  ];

  const handleCreateTier = () => {
    setEditingTier(null);
    setFormData({
      name: '',
      minPoints: '',
      description: '',
      benefits: '',
    });
    setModalActive(true);
  };

  const handleEditTier = (tier: any) => {
    setEditingTier(tier);
    setFormData({
      name: tier.name,
      minPoints: tier.minPoints.toString(),
      description: tier.description,
      benefits: tier.benefits.join('\n'),
    });
    setModalActive(true);
  };

  const handleSaveTier = () => {
    // Mock save functionality
    alert(`${editingTier ? 'Updated' : 'Created'} tier: ${formData.name}`);
    setModalActive(false);
  };

  const tierRows = tiers.map((tier) => [
    <InlineStack key={tier.id} gap="200" blockAlign="center">
      <div
        style={{
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          backgroundColor: tier.level === 1 ? '#CD7F32' : 
                          tier.level === 2 ? '#C0C0C0' :
                          tier.level === 3 ? '#FFD700' : '#E5E4E2',
        }}
      />
      <Text fontWeight="medium">{tier.name}</Text>
    </InlineStack>,
    tier.level,
    tier.minPoints.toLocaleString(),
    tier.memberCount.toLocaleString(),
    tier.benefits.length,
    <Badge key={tier.id} tone={tier.isActive ? 'success' : 'critical'}>
      {tier.isActive ? 'Active' : 'Inactive'}
    </Badge>,
    <InlineStack key={tier.id} gap="200">
      <Button size="slim" onClick={() => handleEditTier(tier)}>
        Edit
      </Button>
      <Button 
        size="slim" 
        variant="primary" 
        tone="critical"
        onClick={() => alert(`Delete ${tier.name} tier`)}
        disabled={tier.memberCount > 0}
      >
        Delete
      </Button>
    </InlineStack>,
  ]);

  const modalMarkup = (
    <Modal
      open={modalActive}
      onClose={() => setModalActive(false)}
      title={editingTier ? 'Edit Tier' : 'Create New Tier'}
      primaryAction={{
        content: editingTier ? 'Update Tier' : 'Create Tier',
        onAction: handleSaveTier,
      }}
      secondaryActions={[
        {
          content: 'Cancel',
          onAction: () => setModalActive(false),
        },
      ]}
    >
      <Modal.Section>
        <FormLayout>
          <TextField
            label="Tier Name"
            value={formData.name}
            onChange={(value) => setFormData(prev => ({ ...prev, name: value }))}
            placeholder="e.g., Gold, VIP, Premium"
            autoComplete="off"
          />

          <TextField
            label="Minimum Points Required"
            type="number"
            value={formData.minPoints}
            onChange={(value) => setFormData(prev => ({ ...prev, minPoints: value }))}
            placeholder="0"
            helpText="Points needed to reach this tier"
            autoComplete="off"
          />

          <TextField
            label="Description"
            value={formData.description}
            onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
            placeholder="Brief description of this tier"
            autoComplete="off"
          />

          <TextField
            label="Benefits"
            value={formData.benefits}
            onChange={(value) => setFormData(prev => ({ ...prev, benefits: value }))}
            placeholder="Enter each benefit on a new line"
            multiline={4}
            helpText="List the benefits members get at this tier (one per line)"
            autoComplete="off"
          />
        </FormLayout>
      </Modal.Section>
    </Modal>
  );

  return (
    <Page
      title="Tier Management"
      subtitle="Configure loyalty tiers and their benefits"
      primaryAction={{
        content: 'Create Tier',
        onAction: handleCreateTier,
      }}
      secondaryActions={[
        {
          content: 'Back to Dashboard',
          url: '/admin-working',
        },
      ]}
    >
      <Layout>
        <Layout.Section>
          <Banner
            title="Tier Configuration Tips"
            tone="info"
          >
            <Text as="p">
              Create meaningful progression with clear benefits at each level. 
              Consider point thresholds that encourage repeat purchases without being too difficult to achieve.
            </Text>
          </Banner>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <InlineStack align="space-between">
                <Text variant="headingMd" as="h3">
                  Current Tiers ({tiers.length})
                </Text>
                <Text variant="bodySm" tone="subdued">
                  Total Members: {tiers.reduce((sum, tier) => sum + tier.memberCount, 0).toLocaleString()}
                </Text>
              </InlineStack>

              <DataTable
                columnContentTypes={['text', 'numeric', 'numeric', 'numeric', 'numeric', 'text', 'text']}
                headings={['Tier', 'Level', 'Min Points', 'Members', 'Benefits', 'Status', 'Actions']}
                rows={tierRows}
              />
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Tier Distribution */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h3">Member Distribution</Text>
              
              <BlockStack gap="300">
                {tiers.map((tier) => {
                  const totalMembers = tiers.reduce((sum, t) => sum + t.memberCount, 0);
                  const percentage = Math.round((tier.memberCount / totalMembers) * 100);
                  
                  return (
                    <div key={tier.id}>
                      <InlineStack align="space-between">
                        <Text variant="bodyMd" fontWeight="medium">
                          {tier.name}
                        </Text>
                        <Text variant="bodySm" tone="subdued">
                          {tier.memberCount} members ({percentage}%)
                        </Text>
                      </InlineStack>
                    </div>
                  );
                })}
              </BlockStack>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>

      {modalMarkup}
    </Page>
  );
}
