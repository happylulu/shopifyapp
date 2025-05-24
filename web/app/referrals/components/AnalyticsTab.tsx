"use client";

import React, { useState, useCallback } from 'react';
import {
  BlockStack,
  InlineStack,
  Text,
  Button,
  Card,
  Box,
  Badge,
  Select,
  DataTable,
  Divider,
  Icon,
  ProgressBar
} from '@shopify/polaris';
import {
  ChartVerticalIcon,
  RefreshIcon,
  CalendarIcon
} from '@shopify/polaris-icons';

interface AnalyticsTabProps {
  analytics: any;
  onRefresh: () => void;
  loading: boolean;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  change: number;
  icon: string;
  color: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, change, icon, color }) => {
  const isPositive = change >= 0;
  const changeColor = isPositive ? '#16a34a' : '#dc2626';
  
  return (
    <Card>
      <BlockStack gap="300">
        <InlineStack align="space-between">
          <Text as="h3" variant="headingXs" tone="subdued">{title}</Text>
          <div style={{ 
            fontSize: '18px', 
            color: color,
            background: `${color}20`,
            borderRadius: '6px',
            padding: '4px 8px'
          }}>
            {icon}
          </div>
        </InlineStack>
        
        <Text as="p" variant="headingLg">{value}</Text>
        
        <InlineStack gap="200" align="center">
          <div style={{ color: changeColor }}>
            <Text as="span" variant="bodyXs">
              {isPositive ? '↗' : '↘'} {Math.abs(change)}%
            </Text>
          </div>
          <Text as="span" variant="bodyXs" tone="subdued">vs last period</Text>
        </InlineStack>
      </BlockStack>
    </Card>
  );
};

const TopPerformersPanel: React.FC<{ data: any }> = ({ data }) => {
  const topReferrers = [
    { name: 'Sarah M.', referrals: 23, revenue: '$1,450', conversionRate: '18%' },
    { name: 'Mike J.', referrals: 19, revenue: '$1,200', conversionRate: '15%' },
    { name: 'Emma R.', referrals: 16, revenue: '$980', conversionRate: '22%' },
    { name: 'David L.', referrals: 14, revenue: '$890', conversionRate: '12%' },
    { name: 'Lisa K.', referrals: 12, revenue: '$720', conversionRate: '19%' }
  ];

  const topPlatforms = [
    { platform: 'WhatsApp', share: 35, color: '#25D366' },
    { platform: 'Email', share: 28, color: '#6B7280' },
    { platform: 'Instagram', share: 18, color: '#E4405F' },
    { platform: 'Facebook', share: 12, color: '#1877F2' },
    { platform: 'Others', share: 7, color: '#9CA3AF' }
  ];

  return (
    <InlineStack gap="500" align="start">
      <Box minWidth="400px">
        <Card>
          <BlockStack gap="400">
            <Text as="h3" variant="headingMd">Top Referrers</Text>
            
            <DataTable
              columnContentTypes={['text', 'numeric', 'text', 'text']}
              headings={['Customer', 'Referrals', 'Revenue', 'Conv. Rate']}
              rows={topReferrers.map((referrer, index) => [
                <InlineStack gap="200" key={index}>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: '#22c55e',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px',
                    fontWeight: 'bold'
                  }}>
                    {index + 1}
                  </div>
                  <Text as="span" variant="bodySm">{referrer.name}</Text>
                </InlineStack>,
                referrer.referrals,
                referrer.revenue,
                <Badge key={index} tone={parseFloat(referrer.conversionRate) > 15 ? 'success' : 'info'}>
                  {referrer.conversionRate}
                </Badge>
              ])}
            />
          </BlockStack>
        </Card>
      </Box>

      <Box minWidth="300px">
        <Card>
          <BlockStack gap="400">
            <Text as="h3" variant="headingMd">Platform Performance</Text>
            
            <BlockStack gap="300">
              {topPlatforms.map((platform, index) => (
                <InlineStack key={index} align="space-between">
                  <InlineStack gap="200">
                    <div style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      background: platform.color
                    }} />
                    <Text as="span" variant="bodySm">{platform.platform}</Text>
                  </InlineStack>
                  <InlineStack gap="200">
                    <ProgressBar 
                      progress={platform.share} 
                      size="small"
                    />
                    <Text as="span" variant="bodySm">{platform.share}%</Text>
                  </InlineStack>
                </InlineStack>
              ))}
            </BlockStack>
          </BlockStack>
        </Card>
      </Box>
    </InlineStack>
  );
};

const RecentActivityPanel: React.FC = () => {
  const activities = [
    {
      type: 'conversion',
      customer: 'John D.',
      action: 'completed a referral purchase',
      value: '$85.00',
      time: '2 hours ago',
      icon: '💰'
    },
    {
      type: 'share',
      customer: 'Sarah M.',
      action: 'shared referral link on Instagram',
      value: '3 clicks',
      time: '4 hours ago',
      icon: '📸'
    },
    {
      type: 'signup',
      customer: 'Mike R.',
      action: 'signed up via referral link',
      value: 'New customer',
      time: '6 hours ago',
      icon: '👤'
    },
    {
      type: 'conversion',
      customer: 'Lisa K.',
      action: 'completed a referral purchase',
      value: '$125.00',
      time: '8 hours ago',
      icon: '💰'
    }
  ];

  return (
    <Card>
      <BlockStack gap="400">
        <Text as="h3" variant="headingMd">Recent Activity</Text>
        
        <BlockStack gap="300">
          {activities.map((activity, index) => (
            <InlineStack key={index} align="space-between">
              <InlineStack gap="300">
                <div style={{ fontSize: '16px' }}>{activity.icon}</div>
                <BlockStack gap="050">
                  <Text as="p" variant="bodySm">
                    <strong>{activity.customer}</strong> {activity.action}
                  </Text>
                  <Text as="p" variant="bodyXs" tone="subdued">{activity.time}</Text>
                </BlockStack>
              </InlineStack>
              <Badge tone={activity.type === 'conversion' ? 'success' : 'info'}>
                {activity.value}
              </Badge>
            </InlineStack>
          ))}
        </BlockStack>
      </BlockStack>
    </Card>
  );
};

export const AnalyticsTab: React.FC<AnalyticsTabProps> = ({ 
  analytics, 
  onRefresh, 
  loading 
}) => {
  const [timeRange, setTimeRange] = useState('30');

  const timeRangeOptions = [
    { label: 'Last 7 days', value: '7' },
    { label: 'Last 30 days', value: '30' },
    { label: 'Last 90 days', value: '90' },
    { label: 'Last 12 months', value: '365' }
  ];

  const metrics = [
    {
      title: 'Total Referral Links',
      value: analytics?.total_links || 0,
      change: 12.5,
      icon: '🔗',
      color: '#3b82f6'
    },
    {
      title: 'Total Clicks',
      value: analytics?.total_clicks || 0,
      change: 8.3,
      icon: '👆',
      color: '#f59e0b'
    },
    {
      title: 'Conversion Rate',
      value: `${analytics?.conversion_rate || 0}%`,
      change: 2.1,
      icon: '📊',
      color: '#10b981'
    },
    {
      title: 'Revenue Generated',
      value: `$${analytics?.total_revenue?.toFixed(2) || '0.00'}`,
      change: 15.7,
      icon: '💰',
      color: '#22c55e'
    }
  ];

  return (
    <BlockStack gap="500">
      {/* Header Controls */}
      <InlineStack align="space-between">
        <BlockStack gap="200">
          <InlineStack gap="200" align="start">
            <Icon source={ChartVerticalIcon} tone="base" />
            <Text as="h2" variant="headingLg">Referral Analytics</Text>
          </InlineStack>
          <Text as="p" variant="bodySm" tone="subdued">
            Track performance and optimize your referral program
          </Text>
        </BlockStack>

        <InlineStack gap="300">
          <Select
            label=""
            options={timeRangeOptions}
            value={timeRange}
            onChange={setTimeRange}
          />
          <Button 
            icon={RefreshIcon}
            onClick={onRefresh}
            loading={loading}
          >
            Refresh
          </Button>
        </InlineStack>
      </InlineStack>

      <Divider />

      {/* Key Metrics */}
      <BlockStack gap="400">
        <Text as="h3" variant="headingMd">Key Metrics</Text>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '16px' 
        }}>
          {metrics.map((metric, index) => (
            <MetricCard key={index} {...metric} />
          ))}
        </div>
      </BlockStack>

      {/* Performance Insights */}
      <BlockStack gap="400">
        <Text as="h3" variant="headingMd">Performance Insights</Text>
        <TopPerformersPanel data={analytics} />
      </BlockStack>

      {/* Recent Activity */}
      <RecentActivityPanel />

      {/* Quick Actions */}
      <Card background="bg-surface-secondary">
        <BlockStack gap="300">
          <Text as="h3" variant="headingSm">Quick Actions</Text>
          <InlineStack gap="300">
            <Button variant="secondary" size="slim">
              Export Analytics
            </Button>
            <Button variant="secondary" size="slim">
              Email Report
            </Button>
            <Button variant="secondary" size="slim">
              View Detailed Report
            </Button>
          </InlineStack>
        </BlockStack>
      </Card>
    </BlockStack>
  );
}; 