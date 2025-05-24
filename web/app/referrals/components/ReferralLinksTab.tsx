"use client";

import React, { useState, useCallback } from 'react';
import {
  BlockStack,
  InlineStack,
  Text,
  TextField,
  Button,
  Card,
  Box,
  Badge,
  DataTable,
  Modal,
  Select,
  Divider,
  Icon,
  Filters,
  ChoiceList,
  Pagination,
  ButtonGroup
} from '@shopify/polaris';
import {
  LinkIcon,
  DeleteIcon,
  EditIcon,
  SearchIcon,
  PlusIcon,
  ExportIcon
} from '@shopify/polaris-icons';

interface ReferralLinksTabProps {
  links: any[];
  onRefresh: () => void;
  loading: boolean;
}

interface CreateLinkModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

const CreateLinkModal: React.FC<CreateLinkModalProps> = ({ open, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    customerEmail: '',
    customerName: '',
    customMessage: '',
    rewardType: 'percentage',
    rewardValue: '10'
  });

  const handleSubmit = () => {
    onSubmit(formData);
    setFormData({
      customerEmail: '',
      customerName: '',
      customMessage: '',
      rewardType: 'percentage',
      rewardValue: '10'
    });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create New Referral Link"
      primaryAction={{
        content: 'Create Link',
        onAction: handleSubmit,
      }}
      secondaryActions={[
        {
          content: 'Cancel',
          onAction: onClose,
        },
      ]}
    >
      <Modal.Section>
        <BlockStack gap="400">
          <TextField
            label="Customer Email"
            value={formData.customerEmail}
            onChange={(value) => setFormData(prev => ({ ...prev, customerEmail: value }))}
            type="email"
            autoComplete="email"
            placeholder="customer@example.com"
          />
          
          <TextField
            label="Customer Name"
            value={formData.customerName}
            onChange={(value) => setFormData(prev => ({ ...prev, customerName: value }))}
            autoComplete="name"
            placeholder="Customer Name"
          />

          <InlineStack gap="300">
            <Select
              label="Reward Type"
              options={[
                { label: 'Percentage Discount', value: 'percentage' },
                { label: 'Fixed Amount', value: 'fixed' },
                { label: 'Points', value: 'points' }
              ]}
              value={formData.rewardType}
              onChange={(value) => setFormData(prev => ({ ...prev, rewardType: value }))}
            />
            
            <TextField
              label="Reward Value"
              value={formData.rewardValue}
              onChange={(value) => setFormData(prev => ({ ...prev, rewardValue: value }))}
              type="number"
              autoComplete="off"
              suffix={formData.rewardType === 'percentage' ? '%' : '$'}
            />
          </InlineStack>

          <TextField
            label="Custom Message (Optional)"
            value={formData.customMessage}
            onChange={(value) => setFormData(prev => ({ ...prev, customMessage: value }))}
            multiline={3}
            autoComplete="off"
            placeholder="Add a personal message for this referral link..."
          />
        </BlockStack>
      </Modal.Section>
    </Modal>
  );
};

export const ReferralLinksTab: React.FC<ReferralLinksTabProps> = ({ 
  links, 
  onRefresh, 
  loading 
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedLinks, setSelectedLinks] = useState<string[]>([]);
  const [searchValue, setSearchValue] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [sortValue, setSortValue] = useState('created_desc');

  // Mock data for demonstration
  const mockLinks = [
    {
      id: '1',
      customerName: 'Sarah Johnson',
      customerEmail: 'sarah@example.com',
      referralCode: 'SARAH2024',
      url: 'yourstore.com/ref/sarah',
      status: 'active',
      clicks: 23,
      conversions: 4,
      revenue: 450.00,
      createdAt: '2024-01-15',
      lastClicked: '2 hours ago'
    },
    {
      id: '2',
      customerName: 'Mike Chen',
      customerEmail: 'mike@example.com',
      referralCode: 'MIKE2024',
      url: 'yourstore.com/ref/mike',
      status: 'active',
      clicks: 18,
      conversions: 2,
      revenue: 280.00,
      createdAt: '2024-01-12',
      lastClicked: '1 day ago'
    },
    {
      id: '3',
      customerName: 'Emma Wilson',
      customerEmail: 'emma@example.com',
      referralCode: 'EMMA2024',
      url: 'yourstore.com/ref/emma',
      status: 'paused',
      clicks: 8,
      conversions: 1,
      revenue: 120.00,
      createdAt: '2024-01-10',
      lastClicked: '3 days ago'
    }
  ];

  const handleCreateLink = useCallback((data: any) => {
    console.log('Creating link:', data);
    // Here you would call your API to create the link
    onRefresh();
  }, [onRefresh]);

  const handleDeleteSelected = useCallback(() => {
    console.log('Deleting links:', selectedLinks);
    setSelectedLinks([]);
    // Here you would call your API to delete the links
  }, [selectedLinks]);

  const handleBulkAction = useCallback((action: string) => {
    console.log('Bulk action:', action, selectedLinks);
    // Handle bulk actions like activate, deactivate, etc.
  }, [selectedLinks]);

  // Filter and sort logic
  const filteredLinks = mockLinks.filter(link => {
    const matchesSearch = link.customerName.toLowerCase().includes(searchValue.toLowerCase()) ||
                         link.customerEmail.toLowerCase().includes(searchValue.toLowerCase()) ||
                         link.referralCode.toLowerCase().includes(searchValue.toLowerCase());
    
    const matchesStatus = statusFilter.length === 0 || statusFilter.includes(link.status);
    
    return matchesSearch && matchesStatus;
  });

  const sortOptions = [
    { label: 'Created (Newest)', value: 'created_desc' },
    { label: 'Created (Oldest)', value: 'created_asc' },
    { label: 'Most Clicks', value: 'clicks_desc' },
    { label: 'Highest Revenue', value: 'revenue_desc' },
    { label: 'Customer Name A-Z', value: 'name_asc' }
  ];

  const statusOptions = [
    { label: 'Active', value: 'active' },
    { label: 'Paused', value: 'paused' },
    { label: 'Expired', value: 'expired' }
  ];

  const filters = [
    {
      key: 'status',
      label: 'Status',
      filter: (
        <ChoiceList
          title="Status"
          titleHidden
          choices={statusOptions}
          selected={statusFilter}
          onChange={setStatusFilter}
          allowMultiple
        />
      ),
      shortcut: true,
    }
  ];

  const appliedFilters = statusFilter.map(status => ({
    key: `status-${status}`,
    label: `Status: ${status}`,
    onRemove: () => setStatusFilter(prev => prev.filter(s => s !== status))
  }));

  const resourceName = {
    singular: 'referral link',
    plural: 'referral links',
  };

  return (
    <BlockStack gap="500">
      {/* Header */}
      <InlineStack align="space-between">
        <BlockStack gap="200">
          <InlineStack gap="200" align="start">
            <Icon source={LinkIcon} tone="base" />
            <Text as="h2" variant="headingLg">Manage Referral Links</Text>
          </InlineStack>
          <Text as="p" variant="bodySm" tone="subdued">
            Create and manage customer referral links
          </Text>
        </BlockStack>

        <Button 
          variant="primary" 
          icon={PlusIcon}
          onClick={() => setShowCreateModal(true)}
        >
          Create Link
        </Button>
      </InlineStack>

      <Divider />

      {/* Filters and Search */}
      <Card>
        <BlockStack gap="400">
          <Filters
            queryValue={searchValue}
            queryPlaceholder="Search by customer name, email, or code"
            filters={filters}
            appliedFilters={appliedFilters}
            onQueryChange={setSearchValue}
            onQueryClear={() => setSearchValue('')}
            onClearAll={() => {
              setSearchValue('');
              setStatusFilter([]);
            }}
          />

          <InlineStack align="space-between">
            <InlineStack gap="300">
              <Select
                label="Sort by"
                options={sortOptions}
                value={sortValue}
                onChange={setSortValue}
              />
              
              {selectedLinks.length > 0 && (
                <ButtonGroup>
                  <Button onClick={() => handleBulkAction('activate')}>
                    Activate ({selectedLinks.length})
                  </Button>
                  <Button onClick={() => handleBulkAction('pause')}>
                    Pause ({selectedLinks.length})
                  </Button>
                  <Button 
                    tone="critical" 
                    onClick={handleDeleteSelected}
                  >
                    Delete ({selectedLinks.length})
                  </Button>
                </ButtonGroup>
              )}
            </InlineStack>

            <InlineStack gap="200">
              <Button icon={ExportIcon} variant="secondary">
                Export
              </Button>
              <Button icon={SearchIcon} onClick={onRefresh} loading={loading}>
                Refresh
              </Button>
            </InlineStack>
          </InlineStack>
        </BlockStack>
      </Card>

      {/* Links Table */}
      <Card>
        <DataTable
          columnContentTypes={['text', 'text', 'text', 'numeric', 'numeric', 'text', 'text', 'text']}
          headings={[
            'Customer',
            'Referral Code',
            'Status',
            'Clicks',
            'Conversions',
            'Revenue',
            'Created',
            'Actions'
          ]}
          rows={filteredLinks.map((link) => [
            <BlockStack gap="100" key={link.id}>
              <Text as="p" variant="bodySm" fontWeight="semibold">
                {link.customerName}
              </Text>
              <Text as="p" variant="bodyXs" tone="subdued">
                {link.customerEmail}
              </Text>
            </BlockStack>,
            
            <BlockStack gap="100" key={link.id}>
              <Text as="p" variant="bodySm" fontFamily="mono">
                {link.referralCode}
              </Text>
              <Text as="p" variant="bodyXs" tone="subdued">
                {link.url}
              </Text>
            </BlockStack>,

            <Badge 
              key={link.id}
              tone={link.status === 'active' ? 'success' : link.status === 'paused' ? 'warning' : 'critical'}
            >
              {link.status}
            </Badge>,

            link.clicks,
            link.conversions,
            `$${link.revenue.toFixed(2)}`,
            
            <BlockStack gap="100" key={link.id}>
              <Text as="p" variant="bodyXs">
                {link.createdAt}
              </Text>
              <Text as="p" variant="bodyXs" tone="subdued">
                Last: {link.lastClicked}
              </Text>
            </BlockStack>,

            <ButtonGroup key={link.id}>
              <Button size="slim" icon={EditIcon}>
                Edit
              </Button>
              <Button size="slim" tone="critical" icon={DeleteIcon}>
                Delete
              </Button>
            </ButtonGroup>
          ])}
          selectable
          selectedRows={selectedLinks}
          onSelectionChange={setSelectedLinks}
        />
      </Card>

      {/* Pagination */}
      <InlineStack align="center">
        <Pagination
          hasPrevious
          onPrevious={() => {}}
          hasNext
          onNext={() => {}}
          label="Page 1 of 10"
        />
      </InlineStack>

      {/* Summary Stats */}
      <Card background="bg-surface-secondary">
        <InlineStack align="space-between">
          <BlockStack gap="100">
            <Text as="p" variant="bodySm" tone="subdued">Total Links</Text>
            <Text as="p" variant="headingSm">{filteredLinks.length}</Text>
          </BlockStack>
          <BlockStack gap="100">
            <Text as="p" variant="bodySm" tone="subdued">Total Clicks</Text>
            <Text as="p" variant="headingSm">
              {filteredLinks.reduce((sum, link) => sum + link.clicks, 0)}
            </Text>
          </BlockStack>
          <BlockStack gap="100">
            <Text as="p" variant="bodySm" tone="subdued">Total Conversions</Text>
            <Text as="p" variant="headingSm">
              {filteredLinks.reduce((sum, link) => sum + link.conversions, 0)}
            </Text>
          </BlockStack>
          <BlockStack gap="100">
            <Text as="p" variant="bodySm" tone="subdued">Total Revenue</Text>
            <Text as="p" variant="headingSm">
              ${filteredLinks.reduce((sum, link) => sum + link.revenue, 0).toFixed(2)}
            </Text>
          </BlockStack>
        </InlineStack>
      </Card>

      {/* Create Link Modal */}
      <CreateLinkModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateLink}
      />
    </BlockStack>
  );
}; 