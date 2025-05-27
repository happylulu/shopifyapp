"use client";

import React from 'react';
import {
  BlockStack,
  InlineStack,
  Text,
  Button,
  Card,
  Box,
  Badge,
  Divider,
  ProgressBar
} from '@shopify/polaris';
import {
  PlusIcon
} from '@shopify/polaris-icons';
import type { SegmentAnalytics } from '../../types/ai-insights';
import aiApi from '../../services/aiApi';

interface SmartSegmentationProps {
  segments: SegmentAnalytics[];
  totalCustomers: number;
}

interface SegmentCardProps {
  segment: SegmentAnalytics;
}

const SegmentCard: React.FC<SegmentCardProps> = ({ segment }) => {
  return (
    <Card>
      <BlockStack gap="400">
        {/* Header */}
        <InlineStack align="space-between">
          <InlineStack gap="300" align="center">
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: segment.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px'
            }}>
              {segment.icon}
            </div>
            <BlockStack gap="050">
              <Text as="h3" variant="headingSm">{segment.name}</Text>
              <Text as="p" variant="bodyXs" tone="subdued">
                {segment.description}
              </Text>
            </BlockStack>
          </InlineStack>
          
          <Badge tone={segment.growth_rate > 0 ? 'success' : 'critical'}>
            {`${segment.growth_rate > 0 ? '+' : ''}${segment.growth_rate.toFixed(1)}%`}
          </Badge>
        </InlineStack>

        {/* Progress Bar */}
        <BlockStack gap="200">
          <InlineStack align="space-between">
            <Text as="p" variant="bodyXs" tone="subdued">
              {segment.customer_count.toLocaleString()} customers
            </Text>
            <Text as="p" variant="bodyXs" tone="subdued">
              {segment.percentage.toFixed(1)}%
            </Text>
          </InlineStack>
          <ProgressBar
            progress={segment.percentage}
            size="small"
          />
        </BlockStack>

        {/* Metrics */}
        <InlineStack align="space-between" wrap={false}>
          <BlockStack gap="100">
            <Text as="p" variant="bodyXs" tone="subdued">Avg Order Value</Text>
            <Text as="p" variant="headingXs">
              {aiApi.formatCurrency(segment.avg_order_value)}
            </Text>
          </BlockStack>

          <BlockStack gap="100">
            <Text as="p" variant="bodyXs" tone="subdued">Total Revenue</Text>
            <Text as="p" variant="headingXs" tone="success">
              {aiApi.formatCurrency(segment.total_revenue)}
            </Text>
          </BlockStack>
        </InlineStack>

        {/* Actions */}
        <InlineStack align="end">
          <Button size="slim" variant="secondary">
            View Customers
          </Button>
        </InlineStack>
      </BlockStack>
    </Card>
  );
};

export const SmartSegmentation: React.FC<SmartSegmentationProps> = ({
  segments,
  totalCustomers
}) => {
  // Sort segments by customer count
  const sortedSegments = [...segments].sort((a, b) => b.customer_count - a.customer_count);

  return (
    <BlockStack gap="500">
      {/* Header */}
      <InlineStack align="space-between">
        <BlockStack gap="200">
          <Text as="h2" variant="headingLg">Smart Segmentation</Text>
          <Text as="p" variant="bodySm" tone="subdued">
            Our AI continually analyzes customer behavior to create actionable segments for targeted campaigns
          </Text>
        </BlockStack>
        
        <Button variant="primary" icon={PlusIcon}>
          Create Segment
        </Button>
      </InlineStack>

      <Divider />

      {/* Overview Stats */}
      <Card background="bg-surface-secondary">
        <InlineStack align="space-between" wrap={false}>
          <BlockStack gap="100">
            <Text as="p" variant="bodyXs" tone="subdued">Total Customers</Text>
            <Text as="p" variant="headingMd">{totalCustomers.toLocaleString()}</Text>
          </BlockStack>
          
          <BlockStack gap="100">
            <Text as="p" variant="bodyXs" tone="subdued">Active Segments</Text>
            <Text as="p" variant="headingMd">{segments.length}</Text>
          </BlockStack>
          
          <BlockStack gap="100">
            <Text as="p" variant="bodyXs" tone="subdued">Coverage</Text>
            <Text as="p" variant="headingMd">
              {segments.reduce((sum, seg) => sum + seg.percentage, 0).toFixed(1)}%
            </Text>
          </BlockStack>
          
          <BlockStack gap="100">
            <Text as="p" variant="bodyXs" tone="subdued">Total Revenue</Text>
            <Text as="p" variant="headingMd" tone="success">
              {aiApi.formatCurrency(segments.reduce((sum, seg) => sum + seg.total_revenue, 0))}
            </Text>
          </BlockStack>
        </InlineStack>
      </Card>

      {/* Segments Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: '16px' 
      }}>
        {sortedSegments.map((segment) => (
          <SegmentCard key={segment.segment} segment={segment} />
        ))}
      </div>

      {/* Insights */}
      <Card background="bg-surface-info">
        <BlockStack gap="300">
          <Text as="h3" variant="headingSm">💡 AI Insights</Text>
          <BlockStack gap="200">
            <Text as="p" variant="bodySm">
              <strong>Growing Segments:</strong> Weekend Shoppers (+15.7%) and New Customers (+22.3%) show strong growth potential.
            </Text>
            <Text as="p" variant="bodySm">
              <strong>At-Risk Alert:</strong> 7% of customers haven&apos;t purchased in 60+ days. Consider a re-engagement campaign.
            </Text>
            <Text as="p" variant="bodySm">
              <strong>Opportunity:</strong> Frequent Browsers have low conversion. Target them with personalized offers.
            </Text>
          </BlockStack>
        </BlockStack>
      </Card>
    </BlockStack>
  );
}; 