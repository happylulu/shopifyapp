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
  ButtonGroup,
  Thumbnail,
  Box
} from '@shopify/polaris';
import { useAdmin } from '../layout';

interface Reward {
  id: string;
  name: string;
  description: string;
  pointsCost: number;
  rewardType: 'discount_percentage' | 'discount_fixed' | 'free_shipping' | 'store_credit' | 'product';
  value: number;
  imageUrl?: string;
  category: string;
  isActive: boolean;
  redemptionCount: number;
  minOrderValue?: number;
  maxUses?: number;
  expiryDays?: number;
  termsAndConditions?: string;
}

// Mock rewards data
const mockRewards: Reward[] = [
  {
    id: '1',
    name: '10% Off Next Order',
    description: 'Get 10% discount on your next purchase',
    pointsCost: 500,
    rewardType: 'discount_percentage',
    value: 10,
    category: 'discount',
    isActive: true,
    redemptionCount: 45,
    minOrderValue: 50,
    expiryDays: 30,
  },
  {
    id: '2',
    name: 'Free Shipping',
    description: 'Free shipping on any order',
    pointsCost: 200,
    rewardType: 'free_shipping',
    value: 0,
    category: 'shipping',
    isActive: true,
    redemptionCount: 38,
    expiryDays: 60,
  },
  {
    id: '3',
    name: '$5 Store Credit',
    description: 'Get $5 credit to use on future purchases',
    pointsCost: 1000,
    rewardType: 'store_credit',
    value: 5,
    category: 'credit',
    isActive: true,
    redemptionCount: 23,
    expiryDays: 90,
  },
];

export default function RewardsManagementPage() {
  const { showToast, setLoading } = useAdmin();
  const [rewards, setRewards] = React.useState<Reward[]>(mockRewards);
  const [modalActive, setModalActive] = React.useState(false);
  const [editingReward, setEditingReward] = React.useState<Reward | null>(null);
  const [formData, setFormData] = React.useState({
    name: '',
    description: '',
    pointsCost: '',
    rewardType: 'discount_percentage',
    value: '',
    category: 'discount',
    isActive: true,
    minOrderValue: '',
    maxUses: '',
    expiryDays: '30',
    termsAndConditions: '',
  });

  const rewardTypeOptions = [
    { label: 'Percentage Discount', value: 'discount_percentage' },
    { label: 'Fixed Amount Discount', value: 'discount_fixed' },
    { label: 'Free Shipping', value: 'free_shipping' },
    { label: 'Store Credit', value: 'store_credit' },
    { label: 'Free Product', value: 'product' },
  ];

  const categoryOptions = [
    { label: 'Discount', value: 'discount' },
    { label: 'Shipping', value: 'shipping' },
    { label: 'Store Credit', value: 'credit' },
    { label: 'Product', value: 'product' },
    { label: 'Experience', value: 'experience' },
  ];

  const handleCreateReward = () => {
    setEditingReward(null);
    setFormData({
      name: '',
      description: '',
      pointsCost: '',
      rewardType: 'discount_percentage',
      value: '',
      category: 'discount',
      isActive: true,
      minOrderValue: '',
      maxUses: '',
      expiryDays: '30',
      termsAndConditions: '',
    });
    setModalActive(true);
  };

  const handleEditReward = (reward: Reward) => {
    setEditingReward(reward);
    setFormData({
      name: reward.name,
      description: reward.description,
      pointsCost: reward.pointsCost.toString(),
      rewardType: reward.rewardType,
      value: reward.value.toString(),
      category: reward.category,
      isActive: reward.isActive,
      minOrderValue: reward.minOrderValue?.toString() || '',
      maxUses: reward.maxUses?.toString() || '',
      expiryDays: reward.expiryDays?.toString() || '30',
      termsAndConditions: reward.termsAndConditions || '',
    });
    setModalActive(true);
  };

  const handleSaveReward = async () => {
    setLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const rewardData = {
        ...formData,
        pointsCost: parseInt(formData.pointsCost),
        value: parseFloat(formData.value),
        minOrderValue: formData.minOrderValue ? parseInt(formData.minOrderValue) : undefined,
        maxUses: formData.maxUses ? parseInt(formData.maxUses) : undefined,
        expiryDays: formData.expiryDays ? parseInt(formData.expiryDays) : undefined,
        redemptionCount: editingReward ? editingReward.redemptionCount : 0,
      };

      if (editingReward) {
        // Update existing reward
        setRewards(prev => prev.map(r => 
          r.id === editingReward.id 
            ? { ...r, ...rewardData }
            : r
        ));
        showToast(`${rewardData.name} updated successfully`);
      } else {
        // Create new reward
        const newReward: Reward = {
          id: Date.now().toString(),
          ...rewardData,
        };
        setRewards(prev => [...prev, newReward]);
        showToast(`${rewardData.name} created successfully`);
      }

      setModalActive(false);
    } catch (error) {
      showToast('Failed to save reward', true);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReward = async (reward: Reward) => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setRewards(prev => prev.filter(r => r.id !== reward.id));
      showToast(`${reward.name} deleted successfully`);
    } catch (error) {
      showToast('Failed to delete reward', true);
    } finally {
      setLoading(false);
    }
  };

  const formatRewardValue = (reward: Reward) => {
    switch (reward.rewardType) {
      case 'discount_percentage':
        return `${reward.value}% off`;
      case 'discount_fixed':
        return `$${reward.value} off`;
      case 'store_credit':
        return `$${reward.value} credit`;
      case 'free_shipping':
        return 'Free shipping';
      case 'product':
        return 'Free product';
      default:
        return reward.value.toString();
    }
  };

  const rewardRows = rewards.map((reward) => [
    <InlineStack key={reward.id} gap="300" blockAlign="center">
      <Thumbnail
        source={reward.imageUrl || 'https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png'}
        alt={reward.name}
        size="small"
      />
      <BlockStack gap="100">
        <Text fontWeight="medium">{reward.name}</Text>
        <Text variant="bodySm" tone="subdued">{reward.description}</Text>
      </BlockStack>
    </InlineStack>,
    reward.pointsCost.toLocaleString(),
    formatRewardValue(reward),
    <Badge key={reward.id} tone="info">{reward.category}</Badge>,
    reward.redemptionCount.toLocaleString(),
    <Badge key={reward.id} tone={reward.isActive ? 'success' : 'critical'}>
      {reward.isActive ? 'Active' : 'Inactive'}
    </Badge>,
    <ButtonGroup key={reward.id}>
      <Button size="slim" onClick={() => handleEditReward(reward)}>
        Edit
      </Button>
      <Button 
        size="slim" 
        variant="primary" 
        tone="critical"
        onClick={() => handleDeleteReward(reward)}
      >
        Delete
      </Button>
    </ButtonGroup>,
  ]);

  const modalMarkup = (
    <Modal
      open={modalActive}
      onClose={() => setModalActive(false)}
      title={editingReward ? 'Edit Reward' : 'Create New Reward'}
      primaryAction={{
        content: editingReward ? 'Update Reward' : 'Create Reward',
        onAction: handleSaveReward,
      }}
      secondaryActions={[
        {
          content: 'Cancel',
          onAction: () => setModalActive(false),
        },
      ]}
      large
    >
      <Modal.Section>
        <FormLayout>
          <FormLayout.Group>
            <TextField
              label="Reward Name"
              value={formData.name}
              onChange={(value) => setFormData(prev => ({ ...prev, name: value }))}
              placeholder="e.g., 10% Off Next Order"
              autoComplete="off"
            />

            <TextField
              label="Points Cost"
              type="number"
              value={formData.pointsCost}
              onChange={(value) => setFormData(prev => ({ ...prev, pointsCost: value }))}
              placeholder="500"
              autoComplete="off"
            />
          </FormLayout.Group>

          <TextField
            label="Description"
            value={formData.description}
            onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
            placeholder="Brief description of the reward"
            autoComplete="off"
          />

          <FormLayout.Group>
            <Select
              label="Reward Type"
              options={rewardTypeOptions}
              value={formData.rewardType}
              onChange={(value) => setFormData(prev => ({ ...prev, rewardType: value }))}
            />

            <TextField
              label="Value"
              type="number"
              value={formData.value}
              onChange={(value) => setFormData(prev => ({ ...prev, value: value }))}
              placeholder={formData.rewardType === 'discount_percentage' ? '10' : '5'}
              suffix={formData.rewardType === 'discount_percentage' ? '%' : '$'}
              autoComplete="off"
            />
          </FormLayout.Group>

          <FormLayout.Group>
            <Select
              label="Category"
              options={categoryOptions}
              value={formData.category}
              onChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
            />

            <TextField
              label="Expiry Days"
              type="number"
              value={formData.expiryDays}
              onChange={(value) => setFormData(prev => ({ ...prev, expiryDays: value }))}
              placeholder="30"
              helpText="Days until reward expires after redemption"
              autoComplete="off"
            />
          </FormLayout.Group>

          <FormLayout.Group>
            <TextField
              label="Minimum Order Value"
              type="number"
              value={formData.minOrderValue}
              onChange={(value) => setFormData(prev => ({ ...prev, minOrderValue: value }))}
              placeholder="Optional"
              prefix="$"
              helpText="Minimum order value to use this reward"
              autoComplete="off"
            />

            <TextField
              label="Max Uses"
              type="number"
              value={formData.maxUses}
              onChange={(value) => setFormData(prev => ({ ...prev, maxUses: value }))}
              placeholder="Unlimited"
              helpText="Maximum times this reward can be redeemed"
              autoComplete="off"
            />
          </FormLayout.Group>

          <TextField
            label="Terms and Conditions"
            value={formData.termsAndConditions}
            onChange={(value) => setFormData(prev => ({ ...prev, termsAndConditions: value }))}
            placeholder="Additional terms and conditions"
            multiline={3}
            autoComplete="off"
          />

          <Checkbox
            label="Active"
            checked={formData.isActive}
            onChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
            helpText="Inactive rewards won't be available for redemption"
          />
        </FormLayout>
      </Modal.Section>
    </Modal>
  );

  return (
    <Page
      title="Rewards Catalog"
      subtitle="Manage rewards that customers can redeem with points"
      primaryAction={{
        content: 'Create Reward',
        onAction: handleCreateReward,
      }}
    >
      <Layout>
        <Layout.Section>
          <Banner
            title="Reward Strategy Tips"
            tone="info"
          >
            <Text as="p">
              Offer a mix of low-cost and high-value rewards to encourage engagement. 
              Consider seasonal rewards and limited-time offers to create urgency.
            </Text>
          </Banner>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <InlineStack align="space-between">
                <Text variant="headingMd" as="h3">
                  Available Rewards ({rewards.length})
                </Text>
                <Text variant="bodySm" tone="subdued">
                  Total Redemptions: {rewards.reduce((sum, reward) => sum + reward.redemptionCount, 0).toLocaleString()}
                </Text>
              </InlineStack>

              {rewards.length > 0 ? (
                <DataTable
                  columnContentTypes={['text', 'numeric', 'text', 'text', 'numeric', 'text', 'text']}
                  headings={['Reward', 'Points Cost', 'Value', 'Category', 'Redemptions', 'Status', 'Actions']}
                  rows={rewardRows}
                />
              ) : (
                <EmptyState
                  heading="No rewards configured"
                  action={{
                    content: 'Create your first reward',
                    onAction: handleCreateReward,
                  }}
                  image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                >
                  <Text as="p">
                    Create rewards that customers can redeem with their loyalty points.
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
