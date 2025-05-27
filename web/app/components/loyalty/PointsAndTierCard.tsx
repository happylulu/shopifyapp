"use client";

import { Card, Text, Badge, Stack, Box, InlineStack } from "@shopify/polaris";
import { useEffect, useState } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";

interface CustomerProfile {
  id: string;
  shopify_customer_id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  points_balance: number;
  current_tier_name?: string;
  total_points_earned: number;
  total_points_redeemed: number;
}

interface Tier {
  id: string;
  name: string;
  tier_level: number;
  min_points_required: number;
}

interface PointsAndTierCardProps {
  customerId: string;
}

export function PointsAndTierCard({ customerId }: PointsAndTierCardProps) {
  const shopify = useAppBridge();
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        
        // Fetch customer profile from FastAPI
        const profileResponse = await fetch(`/api/loyalty/profiles/${customerId}/`);
        if (!profileResponse.ok) {
          throw new Error('Failed to fetch customer profile');
        }
        const profileData = await profileResponse.json();
        setProfile(profileData);

        // Fetch available tiers
        const tiersResponse = await fetch('/api/tiers/');
        if (!tiersResponse.ok) {
          throw new Error('Failed to fetch tiers');
        }
        const tiersData = await tiersResponse.json();
        setTiers(tiersData);

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        shopify.toast.show('Failed to load customer data', { isError: true });
      } finally {
        setLoading(false);
      }
    }

    if (customerId) {
      fetchData();
    }
  }, [customerId, shopify]);

  const getNextTier = () => {
    if (!profile || !tiers.length) return null;
    
    const currentTierLevel = tiers.find(t => t.name === profile.current_tier_name)?.tier_level || 0;
    return tiers.find(t => t.tier_level === currentTierLevel + 1);
  };

  const getProgressToNextTier = () => {
    const nextTier = getNextTier();
    if (!nextTier || !profile) return 0;
    
    const currentTier = tiers.find(t => t.name === profile.current_tier_name);
    const currentTierPoints = currentTier?.min_points_required || 0;
    const pointsNeeded = nextTier.min_points_required - currentTierPoints;
    const pointsProgress = profile.points_balance - currentTierPoints;
    
    return Math.min(100, Math.max(0, (pointsProgress / pointsNeeded) * 100));
  };

  if (loading) {
    return (
      <Card>
        <Box padding="400">
          <Text as="p">Loading customer data...</Text>
        </Box>
      </Card>
    );
  }

  if (error || !profile) {
    return (
      <Card>
        <Box padding="400">
          <Text as="p" tone="critical">
            {error || 'Customer not found'}
          </Text>
        </Box>
      </Card>
    );
  }

  const nextTier = getNextTier();
  const progressPercent = getProgressToNextTier();

  return (
    <Card>
      <Box padding="400">
        <Stack gap="400">
          {/* Customer Info Header */}
          <InlineStack align="space-between">
            <Stack gap="200">
              <Text as="h2" variant="headingMd">
                {profile.first_name} {profile.last_name}
              </Text>
              <Text as="p" tone="subdued">
                {profile.email}
              </Text>
            </Stack>
            {profile.current_tier_name && (
              <Badge tone="info">{profile.current_tier_name}</Badge>
            )}
          </InlineStack>

          {/* Points Balance */}
          <Box padding="300" background="bg-surface-secondary" borderRadius="200">
            <InlineStack align="space-between">
              <Stack gap="100">
                <Text as="p" variant="headingLg">
                  {profile.points_balance.toLocaleString()} points
                </Text>
                <Text as="p" tone="subdued">
                  Current balance
                </Text>
              </Stack>
              <Stack gap="100" align="end">
                <Text as="p" tone="subdued">
                  Earned: {profile.total_points_earned.toLocaleString()}
                </Text>
                <Text as="p" tone="subdued">
                  Redeemed: {profile.total_points_redeemed.toLocaleString()}
                </Text>
              </Stack>
            </InlineStack>
          </Box>

          {/* Tier Progress */}
          {nextTier && (
            <Box>
              <Stack gap="200">
                <InlineStack align="space-between">
                  <Text as="p" variant="bodyMd">
                    Progress to {nextTier.name}
                  </Text>
                  <Text as="p" tone="subdued">
                    {Math.round(progressPercent)}%
                  </Text>
                </InlineStack>
                
                {/* Progress Bar */}
                <Box 
                  background="bg-surface-secondary" 
                  borderRadius="100"
                  style={{ height: '8px', overflow: 'hidden' }}
                >
                  <Box
                    background="bg-fill-brand"
                    style={{ 
                      width: `${progressPercent}%`, 
                      height: '100%',
                      transition: 'width 0.3s ease'
                    }}
                  />
                </Box>
                
                <Text as="p" tone="subdued">
                  {nextTier.min_points_required - profile.points_balance} points to {nextTier.name}
                </Text>
              </Stack>
            </Box>
          )}
        </Stack>
      </Box>
    </Card>
  );
}
