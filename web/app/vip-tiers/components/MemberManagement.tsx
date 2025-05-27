import React, { useState, useCallback } from 'react';
import {
  BlockStack,
  InlineStack,
  Text,
  Box,
  Card,
  Button,
  Badge,
  DataTable,
  Filters,
  ChoiceList,
  TextField,
  Modal,
  FormLayout,
  Select,
  Banner,
  Avatar,
  ProgressBar,
  Popover,
  ActionList,
  Icon,
  Divider
} from '@shopify/polaris';
import {
  SearchIcon,
  FilterIcon,
  ExportIcon,
  EmailIcon,
  EditIcon,
  PersonIcon
} from '@shopify/polaris-icons';
import { VIPMember, VIPTier, VIPTierLevel, CreateVIPMemberRequest } from '../../types/vip';
import vipApi from '../../services/vipApi';

interface MemberManagementProps {
  members: VIPMember[];
  tiers: VIPTier[];
  onRefresh: () => void;
}

export function MemberManagement({ members, tiers, onRefresh }: MemberManagementProps) {
  const [searchValue, setSearchValue] = useState('');
  const [selectedTiers, setSelectedTiers] = useState<string[]>([]);
  const [sortValue, setSortValue] = useState('lifetime_value_desc');
  const [selectedMember, setSelectedMember] = useState<VIPMember | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [popoverActive, setPopoverActive] = useState<string | null>(null);
  
  // Form state for adding new member
  const [newMember, setNewMember] = useState<CreateVIPMemberRequest>({
    customer_id: '',
    customer_name: '',
    customer_email: '',
    tier_level: VIPTierLevel.BRONZE,
    manual_assignment: true,
    notes: ''
  });

  // Filter members based on search and tier selection
  const filteredMembers = members.filter(member => {
    const matchesSearch = searchValue === '' || 
      member.customer_name.toLowerCase().includes(searchValue.toLowerCase()) ||
      member.customer_email.toLowerCase().includes(searchValue.toLowerCase());
    
    const matchesTier = selectedTiers.length === 0 || 
      selectedTiers.includes(member.current_tier);
    
    return matchesSearch && matchesTier;
  });

  // Sort members
  const sortedMembers = [...filteredMembers].sort((a, b) => {
    switch (sortValue) {
      case 'lifetime_value_desc':
        return b.lifetime_value - a.lifetime_value;
      case 'lifetime_value_asc':
        return a.lifetime_value - b.lifetime_value;
      case 'recent_activity':
        return new Date(b.last_activity_at).getTime() - new Date(a.last_activity_at).getTime();
      case 'tier_level':
        const tierOrder = [VIPTierLevel.PLATINUM, VIPTierLevel.GOLD, VIPTierLevel.SILVER, VIPTierLevel.BRONZE];
        return tierOrder.indexOf(a.current_tier) - tierOrder.indexOf(b.current_tier);
      default:
        return 0;
    }
  });

  // Get tier info
  const getTierInfo = (tierLevel: VIPTierLevel) => {
    const tier = tiers.find(t => t.level === tierLevel);
    return tier || null;
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Handle add member
  const handleAddMember = async () => {
    try {
      await vipApi.createMember(newMember);
      setShowAddModal(false);
      onRefresh();
      // Reset form
      setNewMember({
        customer_id: '',
        customer_name: '',
        customer_email: '',
        tier_level: VIPTierLevel.BRONZE,
        manual_assignment: true,
        notes: ''
      });
    } catch (error) {
      console.error('Failed to add member:', error);
    }
  };

  // Table rows
  const rows = sortedMembers.map(member => {
    const tier = getTierInfo(member.current_tier);
    const progressPercentage = member.progress_to_next_tier;
    
    return [
      // Customer info
      <InlineStack gap="300" align="center" blockAlign="center" key={`${member.id}-customer`}>
        <Avatar customer size="sm" />
        <BlockStack gap="100">
          <Text as="span" variant="bodyMd" fontWeight="semibold">
            {member.customer_name}
          </Text>
          <Text as="span" variant="bodySm" tone="subdued">
            {member.customer_email}
          </Text>
        </BlockStack>
      </InlineStack>,
      
      // Tier
      <InlineStack gap="200" align="center" key={`${member.id}-tier`}>
        <Text as="span" variant="headingMd">{tier?.icon}</Text>
        <Badge tone={
          member.current_tier === VIPTierLevel.PLATINUM ? 'info' :
          member.current_tier === VIPTierLevel.GOLD ? 'warning' :
          member.current_tier === VIPTierLevel.SILVER ? 'info' :
          'info'
        }>
          {tier?.name}
        </Badge>
      </InlineStack>,
      
      // Progress to next tier
      member.next_tier ? (
        <BlockStack gap="100" key={`${member.id}-progress`}>
          <InlineStack align="space-between">
            <Text as="span" variant="bodySm">
              ${member.amount_to_next_tier?.toFixed(0)} to {member.next_tier}
            </Text>
            <Text as="span" variant="bodySm" tone="subdued">
              {progressPercentage.toFixed(0)}%
            </Text>
          </InlineStack>
          <ProgressBar progress={progressPercentage / 100} size="small" />
        </BlockStack>
      ) : (
        <Badge tone="success" key={`${member.id}-progress`}>Max Tier</Badge>
      ),
      
      // Lifetime value
      <Text as="span" variant="bodyMd" fontWeight="semibold" key={`${member.id}-value`}>
        ${member.lifetime_value.toLocaleString()}
      </Text>,
      
      // Last activity
      <BlockStack gap="100" key={`${member.id}-activity`}>
        <Text as="span" variant="bodySm">
          {formatDate(member.last_activity_at)}
        </Text>
        <Text as="span" variant="bodySm" tone="subdued">
          {member.total_orders} orders
        </Text>
      </BlockStack>,
      
      // Actions
      <InlineStack gap="200" key={`${member.id}-actions`}>
        <Button
          size="slim"
          onClick={() => {
            setSelectedMember(member);
            setShowDetailsModal(true);
          }}
        >
          View Details
        </Button>
        <Popover
          active={popoverActive === member.id}
          activator={
            <Button
              size="slim"
              icon={EditIcon}
              onClick={() => setPopoverActive(popoverActive === member.id ? null : member.id)}
            />
          }
          onClose={() => setPopoverActive(null)}
        >
          <ActionList
            items={[
              {
                content: 'Send email',
                icon: EmailIcon,
                onAction: () => {
                  console.log('Send email to', member.customer_email);
                  setPopoverActive(null);
                }
              },
              {
                content: 'Update progress',
                onAction: () => {
                  console.log('Update progress for', member.customer_name);
                  setPopoverActive(null);
                }
              },
              {
                content: 'Add note',
                onAction: () => {
                  console.log('Add note for', member.customer_name);
                  setPopoverActive(null);
                }
              }
            ]}
          />
        </Popover>
      </InlineStack>
    ];
  });

  return (
    <BlockStack gap="600">
      {/* Header Actions */}
      <InlineStack align="space-between">
        <Text as="h2" variant="headingLg">VIP Members</Text>
        <InlineStack gap="300">
          <Button icon={ExportIcon} variant="plain">
            Export
          </Button>
          <Button variant="primary" onClick={() => setShowAddModal(true)}>
            Add VIP Member
          </Button>
        </InlineStack>
      </InlineStack>

      {/* Filters */}
      <Card>
        <BlockStack gap="400">
          <InlineStack gap="300" align="start" blockAlign="center">
            <Box minWidth="300px">
              <TextField
                label=""
                placeholder="Search by name or email"
                value={searchValue}
                onChange={setSearchValue}
                prefix={<Icon source={SearchIcon} />}
                autoComplete="off"
              />
            </Box>
            
            <Select
              label=""
              options={[
                { label: 'Highest Value', value: 'lifetime_value_desc' },
                { label: 'Lowest Value', value: 'lifetime_value_asc' },
                { label: 'Recent Activity', value: 'recent_activity' },
                { label: 'Tier Level', value: 'tier_level' }
              ]}
              value={sortValue}
              onChange={setSortValue}
            />
            
            <Filters
              queryValue={searchValue}
              filters={[
                {
                  key: 'tier',
                  label: 'Tier',
                  filter: (
                    <ChoiceList
                      title="Tier"
                      titleHidden
                      choices={[
                        { label: 'Bronze', value: VIPTierLevel.BRONZE },
                        { label: 'Silver', value: VIPTierLevel.SILVER },
                        { label: 'Gold', value: VIPTierLevel.GOLD },
                        { label: 'Platinum', value: VIPTierLevel.PLATINUM }
                      ]}
                      selected={selectedTiers}
                      onChange={setSelectedTiers}
                      allowMultiple
                    />
                  ),
                  shortcut: true
                }
              ]}
              appliedFilters={selectedTiers.map(tier => ({
                key: tier,
                label: tier.charAt(0).toUpperCase() + tier.slice(1),
                onRemove: () => setSelectedTiers(selectedTiers.filter(t => t !== tier))
              }))}
              onQueryChange={setSearchValue}
              onQueryClear={() => setSearchValue('')}
              onClearAll={() => {
                setSearchValue('');
                setSelectedTiers([]);
              }}
            />
          </InlineStack>
        </BlockStack>
      </Card>

      {/* Members Table */}
      <Card>
        <DataTable
          columnContentTypes={['text', 'text', 'text', 'numeric', 'text', 'text']}
          headings={[
            'Customer',
            'Tier',
            'Progress',
            'Lifetime Value',
            'Last Activity',
            'Actions'
          ]}
          rows={rows}
          totals={['', '', '', `$${sortedMembers.reduce((sum, m) => sum + m.lifetime_value, 0).toLocaleString()}`, '', '']}
          showTotalsInFooter
        />
      </Card>

      {/* Member Stats */}
      <Box background="bg-surface-secondary" padding="400" borderRadius="200">
        <InlineStack align="space-between">
          <BlockStack gap="100">
            <Text as="h3" variant="headingSm">Total VIP Members</Text>
            <Text as="p" variant="headingMd" fontWeight="bold">
              {members.length}
            </Text>
          </BlockStack>
          
          <BlockStack gap="100">
            <Text as="h3" variant="headingSm">Average Lifetime Value</Text>
            <Text as="p" variant="headingMd" fontWeight="bold">
              ${(members.reduce((sum, m) => sum + m.lifetime_value, 0) / members.length).toFixed(0)}
            </Text>
          </BlockStack>
          
          <BlockStack gap="100">
            <Text as="h3" variant="headingSm">Total VIP Revenue</Text>
            <Text as="p" variant="headingMd" fontWeight="bold">
              ${members.reduce((sum, m) => sum + m.lifetime_value, 0).toLocaleString()}
            </Text>
          </BlockStack>
        </InlineStack>
      </Box>

      {/* Add Member Modal */}
      <Modal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add VIP Member"
        primaryAction={{
          content: 'Add Member',
          onAction: handleAddMember
        }}
        secondaryActions={[
          {
            content: 'Cancel',
            onAction: () => setShowAddModal(false)
          }
        ]}
      >
        <Modal.Section>
          <FormLayout>
            <TextField
              label="Customer ID"
              value={newMember.customer_id}
              onChange={(value) => setNewMember({ ...newMember, customer_id: value })}
              autoComplete="off"
            />
            <TextField
              label="Customer Name"
              value={newMember.customer_name}
              onChange={(value) => setNewMember({ ...newMember, customer_name: value })}
              autoComplete="off"
            />
            <TextField
              label="Customer Email"
              type="email"
              value={newMember.customer_email}
              onChange={(value) => setNewMember({ ...newMember, customer_email: value })}
              autoComplete="off"
            />
            <Select
              label="VIP Tier"
              options={[
                { label: 'Bronze', value: VIPTierLevel.BRONZE },
                { label: 'Silver', value: VIPTierLevel.SILVER },
                { label: 'Gold', value: VIPTierLevel.GOLD },
                { label: 'Platinum', value: VIPTierLevel.PLATINUM }
              ]}
              value={newMember.tier_level}
              onChange={(value: string) => setNewMember({ ...newMember, tier_level: value as VIPTierLevel })}
            />
            <TextField
              label="Notes"
              value={newMember.notes || ''}
              onChange={(value) => setNewMember({ ...newMember, notes: value })}
              multiline={4}
              maxLength={500}
              autoComplete="off"
            />
          </FormLayout>
        </Modal.Section>
      </Modal>

      {/* Member Details Modal */}
      {selectedMember && (
        <Modal
          open={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
          title={`VIP Member: ${selectedMember.customer_name}`}
          secondaryActions={[
            {
              content: 'Close',
              onAction: () => setShowDetailsModal(false)
            }
          ]}
        >
          <Modal.Section>
            <BlockStack gap="400">
              <InlineStack gap="300" align="center">
                <Avatar customer size="lg" />
                <BlockStack gap="100">
                  <Text as="h3" variant="headingMd">{selectedMember.customer_name}</Text>
                  <Text as="p" variant="bodySm" tone="subdued">{selectedMember.customer_email}</Text>
                  <Badge tone="info">{getTierInfo(selectedMember.current_tier)?.name}</Badge>
                </BlockStack>
              </InlineStack>

              <Divider />

              <BlockStack gap="300">
                <InlineStack align="space-between">
                  <Text as="span" variant="bodySm" tone="subdued">Customer ID</Text>
                  <Text as="span" variant="bodySm">{selectedMember.customer_id}</Text>
                </InlineStack>
                <InlineStack align="space-between">
                  <Text as="span" variant="bodySm" tone="subdued">Member Since</Text>
                  <Text as="span" variant="bodySm">{formatDate(selectedMember.joined_vip_at)}</Text>
                </InlineStack>
                <InlineStack align="space-between">
                  <Text as="span" variant="bodySm" tone="subdued">Tier Started</Text>
                  <Text as="span" variant="bodySm">{formatDate(selectedMember.tier_started_at)}</Text>
                </InlineStack>
                <InlineStack align="space-between">
                  <Text as="span" variant="bodySm" tone="subdued">Lifetime Value</Text>
                  <Text as="span" variant="bodySm" fontWeight="semibold">
                    ${selectedMember.lifetime_value.toLocaleString()}
                  </Text>
                </InlineStack>
                <InlineStack align="space-between">
                  <Text as="span" variant="bodySm" tone="subdued">Total Orders</Text>
                  <Text as="span" variant="bodySm">{selectedMember.total_orders}</Text>
                </InlineStack>
                <InlineStack align="space-between">
                  <Text as="span" variant="bodySm" tone="subdued">Total Points</Text>
                  <Text as="span" variant="bodySm">{selectedMember.total_points.toLocaleString()}</Text>
                </InlineStack>
              </BlockStack>

              {selectedMember.next_tier && (
                <>
                  <Divider />
                  <BlockStack gap="200">
                    <Text as="h4" variant="headingSm">Progress to {selectedMember.next_tier}</Text>
                    <ProgressBar progress={selectedMember.progress_to_next_tier / 100} />
                    <Text as="p" variant="bodySm" tone="subdued">
                      ${selectedMember.amount_to_next_tier?.toFixed(0)} more to reach next tier
                    </Text>
                  </BlockStack>
                </>
              )}

              {selectedMember.notes && (
                <>
                  <Divider />
                  <BlockStack gap="200">
                    <Text as="h4" variant="headingSm">Notes</Text>
                    <Text as="p" variant="bodySm">{selectedMember.notes}</Text>
                  </BlockStack>
                </>
              )}
            </BlockStack>
          </Modal.Section>
        </Modal>
      )}
    </BlockStack>
  );
} 