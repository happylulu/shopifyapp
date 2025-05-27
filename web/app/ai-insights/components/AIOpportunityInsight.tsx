"use client";

import React, { useState } from 'react';
import {
  BlockStack,
  InlineStack,
  Text,
  Button,
  Card,
  Box,
  Badge,
  DataTable,
  Modal,
  ButtonGroup,
  Divider,
  Icon,
  Tooltip
} from '@shopify/polaris';
import {
  StarIcon,
  AlertTriangleIcon,
  ArrowUpIcon,
  ClockIcon
} from '@shopify/polaris-icons';
import type { AIOpportunity, CustomerInsight } from '../../types/ai-insights';
import aiApi from '../../services/aiApi';

interface AIOpportunityInsightProps {
  opportunities: AIOpportunity[];
  onSelectOpportunity: (opportunity: AIOpportunity) => void;
  selectedOpportunity: AIOpportunity | null;
}

interface OpportunityCardProps {
  opportunity: AIOpportunity;
  onClick: () => void;
  isSelected: boolean;
}

const OpportunityCard: React.FC<OpportunityCardProps> = ({ 
  opportunity, 
  onClick, 
  isSelected 
}) => {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'opportunity': return StarIcon;
      case 'warning': return AlertTriangleIcon;
      case 'optimization': return ArrowUpIcon;
      default: return StarIcon;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'opportunity': return '#22c55e';
      case 'warning': return '#ef4444';
      case 'optimization': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  const effortBadge = aiApi.getEffortLevelBadge(opportunity.effort_level);
  const timeToExpire = aiApi.calculateTimeToExpire(opportunity.expires_at);

  return (
    <div 
      onClick={onClick}
      style={{ 
        cursor: 'pointer',
        border: isSelected ? '2px solid #3b82f6' : 'none',
        borderRadius: '8px'
      }}
    >
      <Card>
        <BlockStack gap="400">
          {/* Header */}
          <InlineStack align="space-between">
            <InlineStack gap="300" align="center">
              <Icon 
                source={getTypeIcon(opportunity.type)} 
                tone="base"
                accessibilityLabel={opportunity.type}
              />
              <Text as="h3" variant="headingSm">{opportunity.title}</Text>
              <Badge>New</Badge>
            </InlineStack>
            
            <InlineStack gap="200">
              <Badge tone={effortBadge.tone as any}>{effortBadge.text}</Badge>
              {opportunity.expires_at && (
                <Tooltip content={`Expires: ${aiApi.formatDate(opportunity.expires_at)}`}>
                  <Badge tone="attention">
                    <InlineStack gap="100" align="center">
                      <Icon source={ClockIcon} />
                      <span>{timeToExpire}</span>
                    </InlineStack>
                  </Badge>
                </Tooltip>
              )}
            </InlineStack>
          </InlineStack>

          {/* Content */}
          <Text as="p" variant="bodySm">
            {opportunity.description}
          </Text>

          {/* Metrics */}
          <InlineStack align="space-between" wrap={false}>
            <BlockStack gap="100">
              <Text as="p" variant="bodyXs" tone="subdued">Impact Score</Text>
              <InlineStack gap="200" align="center">
                <Text as="p" variant="headingSm">{opportunity.impact_score.toFixed(0)}/100</Text>
                <div style={{ 
                  width: '60px', 
                  height: '4px', 
                  background: '#e5e7eb', 
                  borderRadius: '2px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${opportunity.impact_score}%`,
                    height: '100%',
                    background: getTypeColor(opportunity.type),
                    borderRadius: '2px'
                  }} />
                </div>
              </InlineStack>
            </BlockStack>

            <BlockStack gap="100">
              <Text as="p" variant="bodyXs" tone="subdued">Potential Revenue</Text>
              <Text as="p" variant="headingSm" tone="success">
                {aiApi.formatCurrency(opportunity.potential_revenue)}
              </Text>
            </BlockStack>

            <BlockStack gap="100">
              <Text as="p" variant="bodyXs" tone="subdued">Confidence</Text>
              <Text as="p" variant="headingSm">
                {(opportunity.confidence * 100).toFixed(0)}%
              </Text>
            </BlockStack>

            <BlockStack gap="100">
              <Text as="p" variant="bodyXs" tone="subdued">Customers</Text>
              <Text as="p" variant="headingSm">
                {opportunity.affected_customers.length.toString()}
              </Text>
            </BlockStack>
          </InlineStack>

          {/* Action */}
          <InlineStack align="end">
            <Button variant="primary" size="slim">
              Review All {opportunity.affected_customers.length} Customers
            </Button>
          </InlineStack>
        </BlockStack>
      </Card>
    </div>
  );
};

const CustomerDetailModal: React.FC<{
  opportunity: AIOpportunity | null;
  open: boolean;
  onClose: () => void;
}> = ({ opportunity, open, onClose }) => {
  if (!opportunity) return null;

  const customerRows = opportunity.affected_customers.map((customer) => [
    <InlineStack gap="200" key={customer.customer_id}>
      <div style={{
        width: '24px',
        height: '24px',
        borderRadius: '50%',
        background: '#22c55e',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '10px',
        fontWeight: 'bold'
      }}>
        {customer.customer_name.charAt(0).toUpperCase()}
      </div>
      <BlockStack gap="050">
        <Text as="p" variant="bodySm" fontWeight="semibold">
          {customer.customer_name}
        </Text>
        <Text as="p" variant="bodyXs" tone="subdued">
          {customer.customer_email}
        </Text>
      </BlockStack>
    </InlineStack>,
    `${customer.orders_count} orders`,
    aiApi.formatCurrency(customer.total_spent),
    <Badge 
      key={customer.customer_id}
      tone={customer.growth_percentage > 0 ? 'success' : 'critical'}
    >
      {`${customer.growth_percentage > 0 ? '+' : ''}${customer.growth_percentage.toFixed(1)}%`}
    </Badge>,
    <ButtonGroup key={customer.customer_id}>
      <Button size="slim" variant="primary">
        Award Points
      </Button>
    </ButtonGroup>
  ]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={opportunity.title}
      primaryAction={{
        content: 'Execute Recommended Action',
        onAction: () => {
          console.log('Execute action for opportunity:', opportunity.id);
          onClose();
        }
      }}
      secondaryActions={[
        {
          content: 'Close',
          onAction: onClose,
        },
      ]}
    >
      <Modal.Section>
        <BlockStack gap="400">
          <Text as="p" variant="bodySm">
            {opportunity.description}
          </Text>

          <Card background="bg-surface-info">
            <BlockStack gap="200">
              <Text as="h4" variant="headingXs">Recommended Action</Text>
              <Text as="p" variant="bodySm">
                {opportunity.recommended_action}
              </Text>
            </BlockStack>
          </Card>

          <DataTable
            columnContentTypes={['text', 'text', 'text', 'text', 'text']}
            headings={['Customer', 'Orders', 'Total Spent', 'Growth', 'Action']}
            rows={customerRows}
          />
        </BlockStack>
      </Modal.Section>
    </Modal>
  );
};

export const AIOpportunityInsight: React.FC<AIOpportunityInsightProps> = ({
  opportunities,
  onSelectOpportunity,
  selectedOpportunity
}) => {
  const [showModal, setShowModal] = useState(false);

  const handleOpportunityClick = (opportunity: AIOpportunity) => {
    onSelectOpportunity(opportunity);
    setShowModal(true);
  };

  // Sort opportunities by impact score
  const sortedOpportunities = [...opportunities].sort((a, b) => b.impact_score - a.impact_score);

  return (
    <BlockStack gap="500">
      {/* Header */}
      <InlineStack align="space-between">
        <BlockStack gap="200">
          <Text as="h2" variant="headingLg">AI Opportunity Insights</Text>
          <Text as="p" variant="bodySm" tone="subdued">
            Our AI has identified {opportunities.length} actionable opportunities to grow your business
          </Text>
        </BlockStack>
        
        <Button variant="secondary">
          View All Insights
        </Button>
      </InlineStack>

      <Divider />

      {/* Opportunities List */}
      <BlockStack gap="400">
        {sortedOpportunities.map((opportunity) => (
          <OpportunityCard
            key={opportunity.id}
            opportunity={opportunity}
            onClick={() => handleOpportunityClick(opportunity)}
            isSelected={selectedOpportunity?.id === opportunity.id}
          />
        ))}
      </BlockStack>

      {/* Customer Detail Modal */}
      <CustomerDetailModal
        opportunity={selectedOpportunity}
        open={showModal}
        onClose={() => setShowModal(false)}
      />
    </BlockStack>
  );
}; 