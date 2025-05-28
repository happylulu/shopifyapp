"use client";

import React from 'react';
import {
  Card,
  BlockStack,
  InlineStack,
  Text,
  Badge,
  SkeletonBodyText,
  SkeletonDisplayText,
  Banner,
  Button,
  Spinner
} from '@shopify/polaris';
import { useLoyaltyProfile } from '../lib/hooks/useLoyaltyProfile';
import { useRewards } from '../lib/hooks/useRewards';
import { ErrorBoundary, useErrorHandler } from './ErrorBoundary';

interface LoyaltyProfileTestProps {
  customerId: string;
  shopDomain?: string;
}

function LoyaltyProfileTestComponent({ customerId, shopDomain = 'demo.myshopify.com' }: LoyaltyProfileTestProps) {
  const { handleError } = useErrorHandler();

  const {
    data: loyaltyProfile,
    isLoading: profileLoading,
    error: profileError,
    refetch: refetchProfile
  } = useLoyaltyProfile({
    customerId,
    shopDomain,
    isAdmin: false
  });

  const {
    data: rewards,
    isLoading: rewardsLoading,
    error: rewardsError,
    refetch: refetchRewards
  } = useRewards({
    customerId,
    shopDomain,
    maxPoints: 1000,
    isAdmin: false
  });

  // Handle errors
  React.useEffect(() => {
    if (profileError) {
      handleError(profileError);
    }
    if (rewardsError) {
      handleError(rewardsError);
    }
  }, [profileError, rewardsError, handleError]);

  if (profileLoading) {
    return (
      <Card>
        <BlockStack gap="400">
          <SkeletonDisplayText size="small" />
          <SkeletonBodyText lines={3} />
        </BlockStack>
      </Card>
    );
  }

  if (profileError) {
    return (
      <Card>
        <Banner
          title="Failed to load loyalty profile"
          status="critical"
          action={{
            content: 'Retry',
            onAction: () => refetchProfile()
          }}
        >
          <Text as="p">
            {profileError instanceof Error ? profileError.message : 'Unknown error occurred'}
          </Text>
        </Banner>
      </Card>
    );
  }

  if (!loyaltyProfile) {
    return (
      <Card>
        <Banner
          title="No loyalty profile found"
          tone="info"
        >
          <Text as="p">
            Customer {customerId} doesn&apos;t have a loyalty profile yet.
          </Text>
        </Banner>
      </Card>
    );
  }

  return (
    <BlockStack gap="400">
      {/* Loyalty Profile Card */}
      <Card>
        <BlockStack gap="400">
          <InlineStack align="space-between">
            <Text variant="headingMd" as="h2">
              Loyalty Profile Test
            </Text>
            <Badge tone="success">Connected</Badge>
          </InlineStack>

          <BlockStack gap="200">
            <InlineStack gap="400">
              <Text as="dt" fontWeight="semibold">Customer ID:</Text>
              <Text as="dd">{loyaltyProfile.customer_id}</Text>
            </InlineStack>

            <InlineStack gap="400">
              <Text as="dt" fontWeight="semibold">Points Balance:</Text>
              <Text as="dd" variant="headingMd" color="success">
                {loyaltyProfile.points_balance.toLocaleString()}
              </Text>
            </InlineStack>

            <InlineStack gap="400">
              <Text as="dt" fontWeight="semibold">Lifetime Points:</Text>
              <Text as="dd">{loyaltyProfile.lifetime_points.toLocaleString()}</Text>
            </InlineStack>

            {loyaltyProfile.current_tier && (
              <InlineStack gap="400">
                <Text as="dt" fontWeight="semibold">Current Tier:</Text>
                <Badge tone="info">{loyaltyProfile.current_tier.name}</Badge>
              </InlineStack>
            )}

            {loyaltyProfile.next_tier && loyaltyProfile.points_to_next_tier && (
              <InlineStack gap="400">
                <Text as="dt" fontWeight="semibold">Next Tier:</Text>
                <Text as="dd">
                  {loyaltyProfile.points_to_next_tier} points to {loyaltyProfile.next_tier.name}
                </Text>
              </InlineStack>
            )}

            <InlineStack gap="400">
              <Text as="dt" fontWeight="semibold">Tier Progress:</Text>
              <Text as="dd">{loyaltyProfile.tier_progress_percentage.toFixed(1)}%</Text>
            </InlineStack>

            <InlineStack gap="400">
              <Text as="dt" fontWeight="semibold">Member Since:</Text>
              <Text as="dd">
                {new Date(loyaltyProfile.member_since).toLocaleDateString()}
              </Text>
            </InlineStack>
          </BlockStack>
        </BlockStack>
      </Card>

      {/* Available Rewards Card */}
      <Card>
        <BlockStack gap="400">
          <InlineStack align="space-between">
            <Text variant="headingMd" as="h2">
              Available Rewards
            </Text>
            {rewardsLoading && <Spinner size="small" />}
          </InlineStack>

          {rewardsError ? (
            <Banner
              title="Failed to load rewards"
              status="warning"
              action={{
                content: 'Retry',
                onAction: () => refetchRewards()
              }}
            >
              <Text as="p">
                {rewardsError instanceof Error ? rewardsError.message : 'Unknown error occurred'}
              </Text>
            </Banner>
          ) : rewards && rewards.length > 0 ? (
            <BlockStack gap="200">
              {rewards.slice(0, 5).map((reward) => (
                <Card key={reward.id} background="bg-surface-secondary">
                  <InlineStack align="space-between">
                    <BlockStack gap="100">
                      <Text fontWeight="semibold">{reward.name}</Text>
                      {reward.description && (
                        <Text tone="subdued" variant="bodySm">
                          {reward.description}
                        </Text>
                      )}
                    </BlockStack>
                    <InlineStack align="center" gap="200">
                      <Text variant="headingSm" tone="success">
                        {reward.points_cost} pts
                      </Text>
                      <Badge tone={reward.available ? "success" : "critical"}>
                        {reward.available ? "Available" : "Unavailable"}
                      </Badge>
                    </InlineStack>
                  </InlineStack>
                </Card>
              ))}
              {rewards.length > 5 && (
                <Text color="subdued" alignment="center">
                  +{rewards.length - 5} more rewards available
                </Text>
              )}
            </BlockStack>
          ) : (
            <Text tone="subdued" alignment="center">
              No rewards available at this time
            </Text>
          )}
        </BlockStack>
      </Card>

      {/* Debug Information */}
      {process.env.NODE_ENV === 'development' && (
        <Card>
          <BlockStack gap="400">
            <Text variant="headingMd" as="h2">
              Debug Information
            </Text>
            <BlockStack gap="200">
              <Text variant="bodySm" color="subdued">
                Shop Domain: {shopDomain}
              </Text>
              <Text variant="bodySm" color="subdued">
                Customer ID: {customerId}
              </Text>
              <Text variant="bodySm" color="subdued">
                Profile Loading: {profileLoading ? 'Yes' : 'No'}
              </Text>
              <Text variant="bodySm" color="subdued">
                Rewards Loading: {rewardsLoading ? 'Yes' : 'No'}
              </Text>
              <Text variant="bodySm" color="subdued">
                Rewards Count: {rewards?.length || 0}
              </Text>
            </BlockStack>
          </BlockStack>
        </Card>
      )}
    </BlockStack>
  );
}

// Wrap with error boundary
export const LoyaltyProfileTest = React.memo(function LoyaltyProfileTest(props: LoyaltyProfileTestProps) {
  return (
    <ErrorBoundary>
      <LoyaltyProfileTestComponent {...props} />
    </ErrorBoundary>
  );
});
