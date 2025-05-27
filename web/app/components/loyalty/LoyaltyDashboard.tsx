"use client";

import { Page, Layout, Card, Text, Stack, Button, InlineStack } from "@shopify/polaris";
import { useState, useEffect } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { PointsAndTierCard } from "./PointsAndTierCard";
import { RewardsList } from "./RewardsList";
import { RedeemModal } from "./RedeemModal";

interface Reward {
  id: string;
  name: string;
  description: string;
  points_cost: number;
  reward_type: string;
}

interface CustomerProfile {
  id: string;
  shopify_customer_id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  points_balance: number;
  current_tier_name?: string;
}

interface LoyaltyDashboardProps {
  customerId: string;
}

export function LoyaltyDashboard({ customerId }: LoyaltyDashboardProps) {
  const shopify = useAppBridge();
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [isRedeemModalOpen, setIsRedeemModalOpen] = useState(false);
  const [customerProfile, setCustomerProfile] = useState<CustomerProfile | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch customer profile for points balance
  useEffect(() => {
    async function fetchProfile() {
      try {
        const response = await fetch(`/api/loyalty/profiles/${customerId}/`);
        if (response.ok) {
          const profile = await response.json();
          setCustomerProfile(profile);
        }
      } catch (error) {
        console.error('Failed to fetch customer profile:', error);
      }
    }

    if (customerId) {
      fetchProfile();
    }
  }, [customerId, refreshKey]);

  const handleRedeemClick = (reward: Reward) => {
    setSelectedReward(reward);
    setIsRedeemModalOpen(true);
  };

  const handleRedeemSuccess = (discountCode?: string) => {
    // Refresh the customer profile to show updated points
    setRefreshKey(prev => prev + 1);
    
    // Show success message with discount code if available
    if (discountCode) {
      shopify.toast.show(
        `Reward redeemed successfully! Discount code: ${discountCode}`,
        { duration: 8000 }
      );
    } else {
      shopify.toast.show('Reward redeemed successfully!');
    }
  };

  const handleCloseModal = () => {
    setIsRedeemModalOpen(false);
    setSelectedReward(null);
  };

  const handleAdjustPoints = async (amount: number, reason: string) => {
    try {
      const response = await fetch(`/api/loyalty/profiles/${customerId}/points/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          reason
        })
      });

      if (!response.ok) {
        throw new Error('Failed to adjust points');
      }

      // Refresh the profile
      setRefreshKey(prev => prev + 1);
      
      shopify.toast.show(
        `${amount > 0 ? 'Added' : 'Deducted'} ${Math.abs(amount)} points: ${reason}`
      );

    } catch (error) {
      shopify.toast.show(
        `Failed to adjust points: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { isError: true }
      );
    }
  };

  if (!customerProfile) {
    return (
      <Page title="Customer Loyalty">
        <Layout>
          <Layout.Section>
            <Card>
              <Text as="p">Loading customer data...</Text>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  return (
    <Page 
      title={`Loyalty Program - ${customerProfile.first_name} ${customerProfile.last_name}`}
      subtitle={customerProfile.email}
      backAction={{ content: 'Customers', url: '/customers' }}
      primaryAction={
        <Button 
          variant="primary" 
          onClick={() => handleAdjustPoints(100, 'Manual adjustment')}
        >
          Add 100 Points
        </Button>
      }
      secondaryActions={[
        {
          content: 'Deduct Points',
          onAction: () => handleAdjustPoints(-50, 'Manual deduction')
        },
        {
          content: 'View History',
          url: `/customers/${customerId}/loyalty/history`
        }
      ]}
    >
      <Layout>
        {/* Customer Points & Tier Card */}
        <Layout.Section variant="oneThird">
          <PointsAndTierCard 
            customerId={customerId} 
            key={`profile-${refreshKey}`}
          />
        </Layout.Section>

        {/* Available Rewards */}
        <Layout.Section variant="twoThirds">
          <RewardsList
            customerPoints={customerProfile.points_balance}
            onRedeemClick={handleRedeemClick}
            key={`rewards-${refreshKey}`}
          />
        </Layout.Section>

        {/* Quick Actions */}
        <Layout.Section>
          <Card>
            <Stack gap="400">
              <Text as="h3" variant="headingMd">
                Quick Actions
              </Text>
              
              <InlineStack gap="300">
                <Button onClick={() => handleAdjustPoints(50, 'Purchase bonus')}>
                  +50 Purchase Bonus
                </Button>
                <Button onClick={() => handleAdjustPoints(25, 'Review bonus')}>
                  +25 Review Bonus
                </Button>
                <Button onClick={() => handleAdjustPoints(100, 'Birthday bonus')}>
                  +100 Birthday Bonus
                </Button>
                <Button onClick={() => handleAdjustPoints(200, 'Referral bonus')}>
                  +200 Referral Bonus
                </Button>
              </InlineStack>
            </Stack>
          </Card>
        </Layout.Section>
      </Layout>

      {/* Redeem Modal */}
      <RedeemModal
        reward={selectedReward}
        customerPoints={customerProfile.points_balance}
        customerId={customerId}
        isOpen={isRedeemModalOpen}
        onClose={handleCloseModal}
        onRedeemSuccess={handleRedeemSuccess}
      />
    </Page>
  );
}
