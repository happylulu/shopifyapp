"use client";

import {
  Modal,
  Text,
  Button,
  Stack,
  InlineStack,
  Box,
  Badge,
  Divider,
  TextField
} from "@shopify/polaris";
import { useState } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";

interface Reward {
  id: string;
  name: string;
  description: string;
  points_cost: number;
  reward_type: string;
}

interface RedeemModalProps {
  reward: Reward | null;
  customerPoints: number;
  customerId: string;
  isOpen: boolean;
  onClose: () => void;
  onRedeemSuccess: (discountCode?: string) => void;
}

export function RedeemModal({ 
  reward, 
  customerPoints, 
  customerId,
  isOpen, 
  onClose, 
  onRedeemSuccess 
}: RedeemModalProps) {
  const shopify = useAppBridge();
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [customerEmail, setCustomerEmail] = useState("");

  if (!reward) return null;

  const handleRedeem = async () => {
    try {
      setIsRedeeming(true);

      // Step 1: Deduct points from customer profile
      const pointsResponse = await fetch(`/api/loyalty/profiles/${customerId}/points/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: -reward.points_cost,
          reason: `Redeemed: ${reward.name}`
        })
      });

      if (!pointsResponse.ok) {
        throw new Error('Failed to deduct points');
      }

      // Step 2: Create discount code via Shopify Admin API
      let discountCode = '';
      
      if (reward.reward_type === 'discount') {
        const discountResponse = await fetch('/api/graphql', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: `
              mutation discountCodeBasicCreate($basicCodeDiscount: DiscountCodeBasicInput!) {
                discountCodeBasicCreate(basicCodeDiscount: $basicCodeDiscount) {
                  codeDiscountNode {
                    id
                    codeDiscount {
                      ... on DiscountCodeBasic {
                        title
                        codes(first: 1) {
                          nodes {
                            code
                          }
                        }
                      }
                    }
                  }
                  userErrors {
                    field
                    message
                  }
                }
              }
            `,
            variables: {
              basicCodeDiscount: {
                title: `Loyalty Reward: ${reward.name}`,
                code: `LOYALTY${Date.now()}`,
                startsAt: new Date().toISOString(),
                endsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
                customerSelection: {
                  customers: {
                    add: [customerId]
                  }
                },
                customerGets: {
                  value: {
                    percentage: 0.1 // 10% discount - could be dynamic based on reward
                  },
                  items: {
                    all: true
                  }
                },
                appliesOncePerCustomer: true,
                usageLimit: 1
              }
            }
          })
        });

        const discountData = await discountResponse.json();
        
        if (discountData.data?.discountCodeBasicCreate?.userErrors?.length > 0) {
          throw new Error(discountData.data.discountCodeBasicCreate.userErrors[0].message);
        }

        discountCode = discountData.data?.discountCodeBasicCreate?.codeDiscountNode?.codeDiscount?.codes?.nodes?.[0]?.code || '';
      }

      // Step 3: Log the redemption
      await fetch('/api/loyalty/redemptions/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer_id: customerId,
          reward_id: reward.id,
          points_cost: reward.points_cost,
          discount_code: discountCode,
          customer_email: customerEmail
        })
      });

      // Success!
      shopify.toast.show(
        `Successfully redeemed ${reward.name}!${discountCode ? ` Discount code: ${discountCode}` : ''}`,
        { duration: 5000 }
      );

      onRedeemSuccess(discountCode);
      onClose();

    } catch (error) {
      console.error('Redemption failed:', error);
      shopify.toast.show(
        `Failed to redeem reward: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { isError: true }
      );
    } finally {
      setIsRedeeming(false);
    }
  };

  const remainingPoints = customerPoints - reward.points_cost;

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="Redeem Reward"
      primaryAction={{
        content: isRedeeming ? 'Redeeming...' : 'Confirm Redemption',
        onAction: handleRedeem,
        loading: isRedeeming,
        disabled: isRedeeming || customerPoints < reward.points_cost
      }}
      secondaryActions={[
        {
          content: 'Cancel',
          onAction: onClose,
          disabled: isRedeeming
        }
      ]}
    >
      <Modal.Section>
        <Stack gap="400">
          {/* Reward Details */}
          <Box padding="300" background="bg-surface-secondary" borderRadius="200">
            <Stack gap="200">
              <InlineStack align="space-between">
                <Text as="h3" variant="headingMd">
                  {reward.name}
                </Text>
                <Badge tone="info">{reward.reward_type}</Badge>
              </InlineStack>
              
              <Text as="p">
                {reward.description}
              </Text>
            </Stack>
          </Box>

          <Divider />

          {/* Points Calculation */}
          <Stack gap="300">
            <Text as="h4" variant="headingMd">
              Points Summary
            </Text>
            
            <InlineStack align="space-between">
              <Text as="p">Current Points:</Text>
              <Text as="p" fontWeight="medium">
                {customerPoints.toLocaleString()}
              </Text>
            </InlineStack>
            
            <InlineStack align="space-between">
              <Text as="p">Reward Cost:</Text>
              <Text as="p" fontWeight="medium" tone="critical">
                -{reward.points_cost.toLocaleString()}
              </Text>
            </InlineStack>
            
            <Divider />
            
            <InlineStack align="space-between">
              <Text as="p" variant="bodyMd" fontWeight="semibold">
                Remaining Points:
              </Text>
              <Text 
                as="p" 
                variant="bodyMd" 
                fontWeight="semibold"
                tone={remainingPoints >= 0 ? "success" : "critical"}
              >
                {remainingPoints.toLocaleString()}
              </Text>
            </InlineStack>
          </Stack>

          {/* Customer Email for Discount Code */}
          {reward.reward_type === 'discount' && (
            <>
              <Divider />
              <Stack gap="200">
                <Text as="h4" variant="headingMd">
                  Delivery Information
                </Text>
                <TextField
                  label="Customer Email"
                  value={customerEmail}
                  onChange={setCustomerEmail}
                  placeholder="customer@example.com"
                  helpText="Discount code will be sent to this email address"
                  autoComplete="email"
                />
              </Stack>
            </>
          )}

          {/* Warning for insufficient points */}
          {customerPoints < reward.points_cost && (
            <Box padding="300" background="bg-fill-critical-secondary" borderRadius="200">
              <Text as="p" tone="critical">
                Insufficient points. Customer needs {(reward.points_cost - customerPoints).toLocaleString()} more points to redeem this reward.
              </Text>
            </Box>
          )}
        </Stack>
      </Modal.Section>
    </Modal>
  );
}
