import React, { useState, useCallback } from 'react';
import {
  BlockStack,
  InlineStack,
  Text,
  Box,
  Card,
  Button,
  Badge,
  TextField,
  Select,
  Checkbox,
  Modal,
  FormLayout,
  Banner,
  Icon,
  Divider,
  Grid,
  Collapsible,
  Tooltip,
  RangeSlider
} from '@shopify/polaris';
import {
  SettingsIcon,
  EditIcon,
  DeleteIcon,
  QuestionCircleIcon,
  StarIcon,
  GiftCardIcon,
  ClockIcon
} from '@shopify/polaris-icons';
import { VIPProgramConfig, VIPTier, VIPTierLevel, VIPBenefit, BenefitType, UpdateVIPTierRequest } from '../../types/vip';
import vipApi from '../../services/vipApi';

interface TierSettingsProps {
  config: VIPProgramConfig | null;
  onUpdate: () => void;
}

export function TierSettings({ config, onUpdate }: TierSettingsProps) {
  const [editingTier, setEditingTier] = useState<VIPTierLevel | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [expandedTiers, setExpandedTiers] = useState<VIPTierLevel[]>([]);
  const [saving, setSaving] = useState(false);
  
  // Program settings state
  const [programSettings, setProgramSettings] = useState({
    auto_upgrade: config?.auto_upgrade ?? true,
    auto_downgrade: config?.auto_downgrade ?? true,
    send_tier_notifications: config?.send_tier_notifications ?? true,
    send_benefit_reminders: config?.send_benefit_reminders ?? true,
    show_progress_bar: config?.show_progress_bar ?? true,
    show_benefits_page: config?.show_benefits_page ?? true
  });

  // Edit form state
  const [editForm, setEditForm] = useState<UpdateVIPTierRequest>({
    name: '',
    description: '',
    min_spent: 0,
    min_points: 0,
    min_orders: 0,
    points_multiplier: 1.0,
    is_active: true
  });

  if (!config) {
    return (
      <BlockStack gap="400">
        <Text as="p">Loading tier settings...</Text>
      </BlockStack>
    );
  }

  // Toggle tier expansion
  const toggleTierExpansion = (tierLevel: VIPTierLevel) => {
    setExpandedTiers(prev => 
      prev.includes(tierLevel) 
        ? prev.filter(t => t !== tierLevel)
        : [...prev, tierLevel]
    );
  };

  // Start editing a tier
  const startEditingTier = (tier: VIPTier) => {
    setEditingTier(tier.level);
    setEditForm({
      name: tier.name,
      description: tier.description,
      min_spent: tier.min_spent || 0,
      min_points: tier.min_points || 0,
      min_orders: tier.min_orders || 0,
      points_multiplier: tier.points_multiplier,
      is_active: tier.is_active
    });
    setShowEditModal(true);
  };

  // Save tier changes
  const saveTierChanges = async () => {
    if (!editingTier) return;
    
    setSaving(true);
    try {
      await vipApi.updateTier(editingTier, editForm);
      setShowEditModal(false);
      onUpdate();
    } catch (error) {
      console.error('Failed to update tier:', error);
    } finally {
      setSaving(false);
    }
  };

  // Save program settings
  const saveProgramSettings = async () => {
    setSaving(true);
    try {
      await vipApi.updateConfig(programSettings);
      onUpdate();
    } catch (error) {
      console.error('Failed to update program settings:', error);
    } finally {
      setSaving(false);
    }
  };

  // Get tier color
  const getTierColor = (level: VIPTierLevel): string => {
    const colors = {
      [VIPTierLevel.BRONZE]: '#CD7F32',
      [VIPTierLevel.SILVER]: '#C0C0C0',
      [VIPTierLevel.GOLD]: '#FFD700',
      [VIPTierLevel.PLATINUM]: '#E5E4E2',
    };
    return colors[level] || '#6B7280';
  };

  // Benefit type icons
  const benefitIcons: Record<string, string> = {
    points_multiplier: '⭐',
    exclusive_discount: '💰',
    free_shipping: '📦',
    early_access: '⏰',
    birthday_reward: '🎂',
    priority_support: '🎯',
    exclusive_products: '👑',
    custom_benefit: '🎁'
  };

  return (
    <BlockStack gap="600">
      {/* Program Settings */}
      <Card>
        <BlockStack gap="400">
          <InlineStack align="space-between">
            <BlockStack gap="200">
              <Text as="h2" variant="headingLg">Program Settings</Text>
              <Text as="p" variant="bodySm" tone="subdued">
                Configure how your VIP program operates
              </Text>
            </BlockStack>
            <Button onClick={saveProgramSettings} loading={saving}>
              Save Settings
            </Button>
          </InlineStack>

          <Divider />

          <Grid>
            <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 6, xl: 6 }}>
              <BlockStack gap="400">
                <Checkbox
                  label="Automatic tier upgrades"
                  checked={programSettings.auto_upgrade}
                  onChange={(value) => setProgramSettings({ ...programSettings, auto_upgrade: value })}
                  helpText="Automatically upgrade customers when they meet tier requirements"
                />
                <Checkbox
                  label="Automatic tier downgrades"
                  checked={programSettings.auto_downgrade}
                  onChange={(value) => setProgramSettings({ ...programSettings, auto_downgrade: value })}
                  helpText="Downgrade customers who no longer meet tier requirements after grace period"
                />
                <Checkbox
                  label="Send tier change notifications"
                  checked={programSettings.send_tier_notifications}
                  onChange={(value) => setProgramSettings({ ...programSettings, send_tier_notifications: value })}
                  helpText="Email customers when their VIP tier changes"
                />
              </BlockStack>
            </Grid.Cell>
            
            <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 6, xl: 6 }}>
              <BlockStack gap="400">
                <Checkbox
                  label="Send benefit reminders"
                  checked={programSettings.send_benefit_reminders}
                  onChange={(value) => setProgramSettings({ ...programSettings, send_benefit_reminders: value })}
                  helpText="Remind customers about unused VIP benefits"
                />
                <Checkbox
                  label="Show progress bar to customers"
                  checked={programSettings.show_progress_bar}
                  onChange={(value) => setProgramSettings({ ...programSettings, show_progress_bar: value })}
                  helpText="Display tier progress in customer account"
                />
                <Checkbox
                  label="Show VIP benefits page"
                  checked={programSettings.show_benefits_page}
                  onChange={(value) => setProgramSettings({ ...programSettings, show_benefits_page: value })}
                  helpText="Enable dedicated VIP benefits page for customers"
                />
              </BlockStack>
            </Grid.Cell>
          </Grid>
        </BlockStack>
      </Card>

      {/* Tier Configuration */}
      <BlockStack gap="400">
        <Text as="h2" variant="headingLg">Tier Configuration</Text>
        
        {config.tiers.map((tier) => (
          <Card key={tier.id}>
            <BlockStack gap="400">
              {/* Tier Header */}
              <InlineStack align="space-between">
                <InlineStack gap="300" align="center">
                  <Text as="span" variant="headingXl">{tier.icon}</Text>
                  <BlockStack gap="100">
                    <InlineStack gap="200" align="center">
                      <Text as="h3" variant="headingMd">{tier.name}</Text>
                      <Badge tone={tier.is_active ? 'success' : 'info'}>
                        {tier.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </InlineStack>
                    <Text as="p" variant="bodySm" tone="subdued">
                      {tier.description}
                    </Text>
                  </BlockStack>
                </InlineStack>
                
                <InlineStack gap="200">
                  <Button
                    size="slim"
                    onClick={() => toggleTierExpansion(tier.level)}
                  >
                    {expandedTiers.includes(tier.level) ? 'Collapse' : 'Expand'}
                  </Button>
                  <Button
                    size="slim"
                    icon={EditIcon}
                    onClick={() => startEditingTier(tier)}
                  >
                    Edit
                  </Button>
                </InlineStack>
              </InlineStack>

              {/* Tier Details (Collapsible) */}
              <Collapsible
                open={expandedTiers.includes(tier.level)}
                id={`tier-${tier.level}`}
                transition={{ duration: '200ms', timingFunction: 'ease-in-out' }}
              >
                <Box paddingBlockStart="400">
                  <BlockStack gap="400">
                    <Divider />
                    
                    {/* Qualification Requirements */}
                    <BlockStack gap="300">
                      <Text as="h4" variant="headingSm">Qualification Requirements</Text>
                      <Grid>
                        <Grid.Cell columnSpan={{ xs: 4, sm: 4, md: 4, lg: 4, xl: 4 }}>
                          <InlineStack gap="200" align="center">
                            <Icon source={StarIcon} tone="subdued" />
                            <BlockStack gap="100">
                              <Text as="p" variant="bodySm" tone="subdued">Minimum Spend</Text>
                              <Text as="p" variant="bodyMd" fontWeight="semibold">
                                ${tier.min_spent?.toLocaleString() || 0}
                              </Text>
                            </BlockStack>
                          </InlineStack>
                        </Grid.Cell>
                        
                        <Grid.Cell columnSpan={{ xs: 4, sm: 4, md: 4, lg: 4, xl: 4 }}>
                          <InlineStack gap="200" align="center">
                            <Icon source={GiftCardIcon} tone="subdued" />
                            <BlockStack gap="100">
                              <Text as="p" variant="bodySm" tone="subdued">Points Multiplier</Text>
                              <Text as="p" variant="bodyMd" fontWeight="semibold">
                                {tier.points_multiplier}x
                              </Text>
                            </BlockStack>
                          </InlineStack>
                        </Grid.Cell>
                        
                        <Grid.Cell columnSpan={{ xs: 4, sm: 4, md: 4, lg: 4, xl: 4 }}>
                          <InlineStack gap="200" align="center">
                            <Icon source={ClockIcon} tone="subdued" />
                            <BlockStack gap="100">
                              <Text as="p" variant="bodySm" tone="subdued">Retention Period</Text>
                              <Text as="p" variant="bodyMd" fontWeight="semibold">
                                {tier.retention_period_days} days
                              </Text>
                            </BlockStack>
                          </InlineStack>
                        </Grid.Cell>
                      </Grid>
                    </BlockStack>

                    {/* Benefits */}
                    <BlockStack gap="300">
                      <Text as="h4" variant="headingSm">Benefits ({tier.benefits.length})</Text>
                      <Grid>
                        {tier.benefits.map((benefit) => (
                          <Grid.Cell key={benefit.id} columnSpan={{ xs: 6, sm: 6, md: 6, lg: 6, xl: 6 }}>
                            <Box background="bg-surface-secondary" padding="300" borderRadius="200">
                              <InlineStack gap="300" align="start">
                                <Text as="span" variant="headingMd">
                                  {benefitIcons[benefit.type] || benefit.icon}
                                </Text>
                                <BlockStack gap="100">
                                  <Text as="p" variant="bodyMd" fontWeight="semibold">
                                    {benefit.name}
                                  </Text>
                                  <Text as="p" variant="bodySm" tone="subdued">
                                    {benefit.description}
                                  </Text>
                                  {benefit.type === BenefitType.POINTS_MULTIPLIER && (
                                    <Badge>{`${benefit.value}x points`}</Badge>
                                  )}
                                  {benefit.type === BenefitType.EXCLUSIVE_DISCOUNT && (
                                    <Badge>{`${benefit.value} off`}</Badge>
                                  )}
                                </BlockStack>
                              </InlineStack>
                            </Box>
                          </Grid.Cell>
                        ))}
                      </Grid>
                    </BlockStack>

                    {/* Additional Settings */}
                    <BlockStack gap="300">
                      <Text as="h4" variant="headingSm">Additional Settings</Text>
                      <InlineStack gap="400">
                        <BlockStack gap="100">
                          <Text as="p" variant="bodySm" tone="subdued">Grace Period</Text>
                          <Text as="p" variant="bodyMd">{tier.grace_period_days} days</Text>
                        </BlockStack>
                        <BlockStack gap="100">
                          <Text as="p" variant="bodySm" tone="subdued">Qualification Period</Text>
                          <Text as="p" variant="bodyMd">
                            {tier.qualification_period_days === 0 ? 'Lifetime' : `${tier.qualification_period_days} days`}
                          </Text>
                        </BlockStack>
                        <BlockStack gap="100">
                          <Text as="p" variant="bodySm" tone="subdued">Welcome Message</Text>
                          <Text as="p" variant="bodyMd" truncate>
                            {tier.welcome_message}
                          </Text>
                        </BlockStack>
                      </InlineStack>
                    </BlockStack>
                  </BlockStack>
                </Box>
              </Collapsible>
            </BlockStack>
          </Card>
        ))}
      </BlockStack>

      {/* Edit Tier Modal */}
      <Modal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        title={`Edit ${editingTier ? editingTier.charAt(0).toUpperCase() + editingTier.slice(1) : ''} Tier`}
        primaryAction={{
          content: 'Save Changes',
          onAction: saveTierChanges,
          loading: saving
        }}
        secondaryActions={[
          {
            content: 'Cancel',
            onAction: () => setShowEditModal(false)
          }
        ]}
      >
        <Modal.Section>
          <FormLayout>
            <TextField
              label="Tier Name"
              value={editForm.name || ''}
              onChange={(value) => setEditForm({ ...editForm, name: value })}
              autoComplete="off"
            />
            
            <TextField
              label="Description"
              value={editForm.description || ''}
              onChange={(value) => setEditForm({ ...editForm, description: value })}
              multiline={2}
              autoComplete="off"
            />
            
            <TextField
              label="Minimum Spend Required"
              type="number"
              value={editForm.min_spent?.toString() || '0'}
              onChange={(value) => setEditForm({ ...editForm, min_spent: parseFloat(value) || 0 })}
              prefix="$"
              autoComplete="off"
            />
            
            <TextField
              label="Points Multiplier"
              type="number"
              value={editForm.points_multiplier?.toString() || '1'}
              onChange={(value) => setEditForm({ ...editForm, points_multiplier: parseFloat(value) || 1 })}
              suffix="x"
              helpText="How many times more points members earn"
              autoComplete="off"
            />
            
            <Checkbox
              label="Tier is active"
              checked={editForm.is_active || false}
              onChange={(value) => setEditForm({ ...editForm, is_active: value })}
            />
          </FormLayout>
        </Modal.Section>
      </Modal>

      {/* Help Section */}
      <Box background="bg-surface-secondary" padding="400" borderRadius="200">
        <BlockStack gap="300">
          <InlineStack gap="200" align="center">
            <Icon source={QuestionCircleIcon} tone="base" />
            <Text as="h3" variant="headingSm">Tier Configuration Tips</Text>
          </InlineStack>
          <BlockStack gap="200">
            <Text as="p" variant="bodySm">
              • Set clear spending thresholds that encourage customers to reach the next tier
            </Text>
            <Text as="p" variant="bodySm">
              • Ensure each tier offers meaningful benefits that justify the spending requirement
            </Text>
            <Text as="p" variant="bodySm">
              • Consider your customer base when setting qualification periods (annual vs lifetime)
            </Text>
            <Text as="p" variant="bodySm">
              • Use grace periods to give customers time to re-qualify before downgrading
            </Text>
          </BlockStack>
        </BlockStack>
      </Box>
    </BlockStack>
  );
} 