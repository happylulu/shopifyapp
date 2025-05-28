"use client";

import React from 'react';
import {
  Page,
  Layout,
  Card,
  BlockStack,
  InlineStack,
  Text,
  Button,
  DataTable,
  Badge,
  Modal,
  TextField,
  FormLayout,
  Select,
  Checkbox,
  Banner,
  EmptyState,
  ButtonGroup
} from '@shopify/polaris';
import { useAdmin } from '../layout';

interface Tier {
  id: string;
  name: string;
  level: number;
  minPointsRequired: number;
  description: string;
  benefits: string[];
  color: string;
  icon?: string;
  isActive: boolean;
  memberCount: number;
}

// Mock tier data
const mockTiers: Tier[] = [
  {
    id: '1',
    name: 'Bronze',
    level: 1,
    minPointsRequired: 0,
    description: 'Welcome tier for new members',
    benefits: ['1x points on purchases', 'Birthday discount'],
    color: '#CD7F32',
    isActive: true,
    memberCount: 623,
  },
  {
    id: '2',
    name: 'Silver',
    level: 2,
    minPointsRequired: 500,
    description: 'Tier for regular customers',
    benefits: ['1.2x points on purchases', 'Free shipping', 'Early access to sales'],
    color: '#C0C0C0',
    isActive: true,
    memberCount: 374,
  },
  {
    id: '3',
    name: 'Gold',
    level: 3,
    minPointsRequired: 1500,
    description: 'Premium tier for loyal customers',
    benefits: ['1.5x points on purchases', 'Free shipping', 'Priority support', 'Exclusive products'],
    color: '#FFD700',
    isActive: true,
    memberCount: 187,
  },
  {
    id: '4',
    name: 'Platinum',
    level: 4,
    minPointsRequired: 5000,
    description: 'VIP tier for top customers',
    benefits: ['2x points on purchases', 'Free shipping', 'Priority support', 'Personal shopper', 'VIP events'],
    color: '#E5E4E2',
    isActive: true,
    memberCount: 63,
  },
];

export default function TierManagementPage() {
  const { showToast, setLoading } = useAdmin();
  const [tiers, setTiers] = React.useState<Tier[]>(mockTiers);
  const [modalActive, setModalActive] = React.useState(false);
  const [editingTier, setEditingTier] = React.useState<Tier | null>(null);
  const [formData, setFormData] = React.useState({
    name: '',
    minPointsRequired: '',
    description: '',
    benefits: '',
    color: '#000000',
    isActive: true,
  });

  const colorOptions = [
    { label: 'Bronze', value: '#CD7F32' },
    { label: 'Silver', value: '#C0C0C0' },
    { label: 'Gold', value: '#FFD700' },
    { label: 'Platinum', value: '#E5E4E2' },
    { label: 'Blue', value: '#0066CC' },
    { label: 'Purple', value: '#6B46C1' },
    { label: 'Green', value: '#059669' },
    { label: 'Red', value: '#DC2626' },
  ];

  const handleCreateTier = () => {
    setEditingTier(null);
    setFormData({
      name: '',
      minPointsRequired: '',
      description: '',
      benefits: '',
      color: '#000000',
      isActive: true,
    });
    setModalActive(true);
  };

  const handleEditTier = (tier: Tier) => {
    setEditingTier(tier);
    setFormData({
      name: tier.name,
      minPointsRequired: tier.minPointsRequired.toString(),
      description: tier.description,
      benefits: tier.benefits.join('\n'),
      color: tier.color,
      isActive: tier.isActive,
    });
    setModalActive(true);
  };

  const handleSaveTier = async () => {
    setLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const tierData = {
        ...formData,
        minPointsRequired: parseInt(formData.minPointsRequired),
        benefits: formData.benefits.split('\n').filter(b => b.trim()),
        level: editingTier ? editingTier.level : tiers.length + 1,
        memberCount: editingTier ? editingTier.memberCount : 0,
      };

      if (editingTier) {
        // Update existing tier
        setTiers(prev => prev.map(t => 
          t.id === editingTier.id 
            ? { ...t, ...tierData }
            : t
        ));
        showToast(`${tierData.name} tier updated successfully`);
      } else {
        // Create new tier
        const newTier: Tier = {
          id: Date.now().toString(),
          ...tierData,
        };
        setTiers(prev => [...prev, newTier]);
        showToast(`${tierData.name} tier created successfully`);
      }

      setModalActive(false);
    } catch (error) {
      showToast('Failed to save tier', true);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTier = async (tier: Tier) => {
    if (tier.memberCount > 0) {
      showToast('Cannot delete tier with existing members', true);
      return;
    }

    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setTiers(prev => prev.filter(t => t.id !== tier.id));
      showToast(`${tier.name} tier deleted successfully`);
    } catch (error) {
      showToast('Failed to delete tier', true);
    } finally {
      setLoading(false);
    }
  };

  const tierRows = tiers
    .sort((a, b) => a.level - b.level)
    .map((tier) => [
      <InlineStack key={tier.id} gap="200" blockAlign="center">
        <div
          style={{
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            backgroundColor: tier.color,
          }}
        />
        <Text fontWeight="medium">{tier.name}</Text>
      </InlineStack>,
      tier.level,
      tier.minPointsRequired.toLocaleString(),
      tier.memberCount.toLocaleString(),
      tier.benefits.length,
      <Badge key={tier.id} tone={tier.isActive ? 'success' : 'critical'}>
        {tier.isActive ? 'Active' : 'Inactive'}
      </Badge>,
      <ButtonGroup key={tier.id}>
        <Button size="slim" onClick={() => handleEditTier(tier)}>
          Edit
        </Button>
        <Button 
          size="slim" 
          variant="primary" 
          tone="critical"
          onClick={() => handleDeleteTier(tier)}
          disabled={tier.memberCount > 0}
        >
          Delete
        </Button>
      </ButtonGroup>,
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
            value={formData.minPointsRequired}
            onChange={(value) => setFormData(prev => ({ ...prev, minPointsRequired: value }))}
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

          <Select
            label="Tier Color"
            options={colorOptions}
            value={formData.color}
            onChange={(value) => setFormData(prev => ({ ...prev, color: value }))}
          />

          <Checkbox
            label="Active"
            checked={formData.isActive}
            onChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
            helpText="Inactive tiers won't be available for new members"
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

              {tiers.length > 0 ? (
                <DataTable
                  columnContentTypes={['text', 'numeric', 'numeric', 'numeric', 'numeric', 'text', 'text']}
                  headings={['Tier', 'Level', 'Min Points', 'Members', 'Benefits', 'Status', 'Actions']}
                  rows={tierRows}
                />
              ) : (
                <EmptyState
                  heading="No tiers configured"
                  action={{
                    content: 'Create your first tier',
                    onAction: handleCreateTier,
                  }}
                  image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                >
                  <Text as="p">
                    Set up loyalty tiers to reward your customers based on their engagement and spending.
                  </Text>
                </EmptyState>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>

      {modalMarkup}
    </Page>
  );
}
