"use client";

import React from 'react';
import { BlockStack, Text, Card } from '@shopify/polaris';
import type { AIPerformanceMetrics } from '../../types/ai-insights';

interface PerformanceMetricsProps {
  metrics: AIPerformanceMetrics;
}

export const PerformanceMetrics: React.FC<PerformanceMetricsProps> = ({ metrics }) => {
  return (
    <BlockStack gap="400">
      <Text as="h2" variant="headingLg">AI Performance</Text>
      <Card>
        <Text as="p">AI Performance Metrics - Coming Soon</Text>
      </Card>
    </BlockStack>
  );
}; 