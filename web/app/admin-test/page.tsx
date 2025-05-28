"use client";

import React from 'react';
import { Card, Text, Button, BlockStack } from '@shopify/polaris';

export default function AdminTestPage() {
  return (
    <div style={{ padding: '20px' }}>
      <Card>
        <BlockStack gap="400">
          <Text variant="headingLg" as="h1">
            Admin Test Page
          </Text>
          
          <Text as="p">
            This is a simple test page to verify that the admin routing is working correctly.
          </Text>
          
          <Text as="p">
            If you can see this page, then Next.js routing is working properly.
          </Text>
          
          <Button 
            variant="primary"
            onClick={() => window.location.href = '/admin'}
          >
            Go to Admin Dashboard
          </Button>
          
          <Button 
            onClick={() => window.location.href = '/'}
          >
            Go to Home
          </Button>
        </BlockStack>
      </Card>
    </div>
  );
}
