/**
 * React Hook for Loyalty Profile Management
 * Provides type-safe access to customer loyalty data
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createStorefrontClient, createAdminClient } from '../graphql-client';
import type {
  GetCustomerLoyaltyProfileQuery,
  GetCustomerLoyaltyProfileQueryVariables,
  GetAvailableRewardsQuery,
  GetAvailableRewardsQueryVariables,
  GetPointsHistoryQuery,
  GetPointsHistoryQueryVariables,
  RedeemRewardMutation,
  RedeemRewardMutationVariables,
  TrackCustomerActionMutation,
  TrackCustomerActionMutationVariables,
  LoyaltyProfile,
  Reward,
  PointsTransaction
} from '../generated/graphql';

interface UseLoyaltyProfileOptions {
  customerId: string;
  shopDomain: string;
  accessToken?: string;
  isAdmin?: boolean;
}

export function useLoyaltyProfile({
  customerId,
  shopDomain,
  accessToken,
  isAdmin = false
}: UseLoyaltyProfileOptions) {
  const client = isAdmin
    ? createAdminClient(shopDomain, accessToken!)
    : createStorefrontClient(shopDomain, accessToken);

  return useQuery({
    queryKey: ['loyaltyProfile', customerId, shopDomain],
    queryFn: async () => {
      const result = await client.GetCustomerLoyaltyProfile({ customerId });
      return result.loyaltyProfile;
    },
    enabled: !!customerId && !!shopDomain,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

// Note: useAvailableRewards and usePointsHistory have been moved to separate files
// Import them from './useRewards' and './usePointsHistory' respectively

export function useRedeemReward({
  shopDomain,
  accessToken,
  isAdmin = false
}: Omit<UseLoyaltyProfileOptions, 'customerId'>) {
  const queryClient = useQueryClient();
  const client = isAdmin
    ? createAdminClient(shopDomain, accessToken!)
    : createStorefrontClient(shopDomain, accessToken);

  return useMutation({
    mutationFn: async (variables: RedeemRewardMutationVariables) => {
      const result = await client.RedeemReward(variables);
      return result.redeemReward;
    },
    onSuccess: (data, variables) => {
      // Invalidate loyalty profile to refresh points balance
      queryClient.invalidateQueries({
        queryKey: ['loyaltyProfile', variables.input.customer_id, shopDomain]
      });

      // Invalidate points history
      queryClient.invalidateQueries({
        queryKey: ['pointsHistory', variables.input.customer_id, shopDomain]
      });
    },
  });
}

// Note: useTrackAction has been moved to useRedemption.ts to avoid conflicts

// Hook for real-time loyalty updates
export function useLoyaltyUpdates({
  customerId,
  shopDomain,
  onPointsUpdate,
  onTierUpdate,
}: {
  customerId: string;
  shopDomain: string;
  onPointsUpdate?: (newBalance: number) => void;
  onTierUpdate?: (newTier: string) => void;
}) {
  const queryClient = useQueryClient();

  // This would connect to WebSocket or Server-Sent Events for real-time updates
  // For now, we'll use polling as a fallback
  return useQuery({
    queryKey: ['loyaltyUpdates', customerId, shopDomain],
    queryFn: async () => {
      // Check for updates and trigger callbacks
      const currentData = queryClient.getQueryData(['loyaltyProfile', customerId, shopDomain]);
      return currentData;
    },
    refetchInterval: 30000, // Poll every 30 seconds
    enabled: !!customerId && !!shopDomain,
  });
}

// Hook for loyalty profile with caching and optimistic updates
export function useOptimisticLoyaltyProfile({
  customerId,
  shopDomain,
  accessToken,
  isAdmin = false
}: UseLoyaltyProfileOptions) {
  const queryClient = useQueryClient();
  const { data, ...query } = useLoyaltyProfile({
    customerId,
    shopDomain,
    accessToken,
    isAdmin
  });

  const updatePointsOptimistically = (pointsChange: number, reason: string) => {
    queryClient.setQueryData(
      ['loyaltyProfile', customerId, shopDomain],
      (oldData: any) => {
        if (!oldData) return oldData;

        return {
          ...oldData,
          points_balance: oldData.points_balance + pointsChange,
          // Update tier progress if applicable
          tier_progress_percentage: oldData.next_tier
            ? Math.min(100, ((oldData.points_balance + pointsChange - oldData.current_tier?.min_points_required || 0) /
                (oldData.next_tier.min_points_required - oldData.current_tier?.min_points_required || 1)) * 100)
            : 100
        };
      }
    );
  };

  const revertOptimisticUpdate = () => {
    queryClient.invalidateQueries({
      queryKey: ['loyaltyProfile', customerId, shopDomain]
    });
  };

  return {
    data,
    ...query,
    updatePointsOptimistically,
    revertOptimisticUpdate,
  };
}

// Hook for batch operations
export function useBatchLoyaltyOperations({
  shopDomain,
  accessToken,
  isAdmin = false
}: Omit<UseLoyaltyProfileOptions, 'customerId'>) {
  const queryClient = useQueryClient();

  const batchRedeemRewards = async (redemptions: Array<{
    customerId: string;
    rewardId: string;
    quantity?: number;
  }>) => {
    const results = await Promise.allSettled(
      redemptions.map(async (redemption) => {
        const client = isAdmin
          ? createAdminClient(shopDomain, accessToken!)
          : createStorefrontClient(shopDomain, accessToken);

        return client.RedeemReward({
          input: {
            customer_id: redemption.customerId,
            reward_id: redemption.rewardId,
            quantity: redemption.quantity || 1
          }
        });
      })
    );

    // Invalidate all affected customer profiles
    redemptions.forEach(({ customerId }) => {
      queryClient.invalidateQueries({
        queryKey: ['loyaltyProfile', customerId, shopDomain]
      });
    });

    return results;
  };

  const batchTrackActions = async (actions: Array<{
    customerId: string;
    actionType: string;
    metadata?: string;
  }>) => {
    const results = await Promise.allSettled(
      actions.map(async (action) => {
        const client = isAdmin
          ? createAdminClient(shopDomain, accessToken!)
          : createStorefrontClient(shopDomain, accessToken);

        return client.TrackCustomerAction({
          input: {
            customer_id: action.customerId,
            action_type: action.actionType,
            metadata: action.metadata
          }
        });
      })
    );

    // Invalidate all affected customer profiles
    actions.forEach(({ customerId }) => {
      queryClient.invalidateQueries({
        queryKey: ['loyaltyProfile', customerId, shopDomain]
      });
    });

    return results;
  };

  return {
    batchRedeemRewards,
    batchTrackActions,
  };
}
