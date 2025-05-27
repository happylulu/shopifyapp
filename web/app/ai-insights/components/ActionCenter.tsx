"use client";

import React from 'react';
import { BlockStack, Text, Card } from '@shopify/polaris';
import type { AIOpportunity, AIPerformanceMetrics } from '../../types/ai-insights';

interface ActionCenterProps {
  opportunities: AIOpportunity[];
  performance: AIPerformanceMetrics;
}

export const ActionCenter: React.FC<ActionCenterProps> = ({ opportunities, performance }) => {
  return (
    <BlockStack gap="400">
      <Text as="h2" variant="headingLg">Action Center</Text>
      <Card>
        <Text as="p">AI Action Center - Coming Soon</Text>
      </Card>
    </BlockStack>
  );
}; 