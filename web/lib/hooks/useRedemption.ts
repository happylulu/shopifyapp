/**
 * React Hook for Reward Redemption
 * Provides type-safe reward redemption functionality with optimistic updates
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createStorefrontClient, createAdminClient } from '../graphql-client';
import type { 
  RedeemRewardMutation,
  RedeemRewardMutationVariables,
  TrackCustomerActionMutation,
  TrackCustomerActionMutationVariables
} from '../generated/graphql';

interface UseRedemptionOptions {
  shopDomain: string;
  accessToken?: string;
  isAdmin?: boolean;
  onSuccess?: (result: RedeemRewardMutation['redeemReward']) => void;
  onError?: (error: any) => void;
}

export function useRedemption({
  shopDomain,
  accessToken,
  isAdmin = false,
  onSuccess,
  onError
}: UseRedemptionOptions) {
  const queryClient = useQueryClient();
  const client = isAdmin 
    ? createAdminClient(shopDomain, accessToken!)
    : createStorefrontClient(shopDomain, accessToken);

  return useMutation({
    mutationFn: async (variables: RedeemRewardMutationVariables) => {
      const result = await client.RedeemReward(variables);
      return result.redeemReward;
    },
    onMutate: async (variables) => {
      // Optimistic update
      const customerId = variables.input.customer_id;
      const queryKey = ['loyaltyProfile', customerId, shopDomain];
      
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey });
      
      // Snapshot the previous value
      const previousProfile = queryClient.getQueryData(queryKey);
      
      // Return context with the previous value
      return { previousProfile, customerId };
    },
    onError: (error, variables, context) => {
      // Revert optimistic update on error
      if (context?.previousProfile) {
        queryClient.setQueryData(
          ['loyaltyProfile', context.customerId, shopDomain],
          context.previousProfile
        );
      }
      onError?.(error);
    },
    onSuccess: (data, variables, context) => {
      // Update loyalty profile with new balance
      if (data.success && data.new_balance !== null) {
        queryClient.setQueryData(
          ['loyaltyProfile', variables.input.customer_id, shopDomain],
          (oldData: any) => {
            if (!oldData) return oldData;
            return {
              ...oldData,
              points_balance: data.new_balance
            };
          }
        );
      }
      
      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: ['pointsHistory', variables.input.customer_id, shopDomain]
      });
      
      onSuccess?.(data);
    },
    onSettled: (data, error, variables) => {
      // Always refetch loyalty profile to ensure consistency
      queryClient.invalidateQueries({
        queryKey: ['loyaltyProfile', variables.input.customer_id, shopDomain]
      });
    },
  });
}

// Hook for tracking customer actions
export function useTrackAction({
  shopDomain,
  accessToken,
  isAdmin = false
}: Omit<UseRedemptionOptions, 'onSuccess' | 'onError'>) {
  const queryClient = useQueryClient();
  const client = isAdmin 
    ? createAdminClient(shopDomain, accessToken!)
    : createStorefrontClient(shopDomain, accessToken);

  return useMutation({
    mutationFn: async (variables: TrackCustomerActionMutationVariables) => {
      const result = await client.TrackCustomerAction(variables);
      return result.trackAction;
    },
    onSuccess: (data, variables) => {
      // Invalidate loyalty profile to refresh after action tracking
      queryClient.invalidateQueries({
        queryKey: ['loyaltyProfile', variables.input.customer_id, shopDomain]
      });
    },
  });
}

// Hook for batch redemptions
export function useBatchRedemption({
  shopDomain,
  accessToken,
  isAdmin = false
}: Omit<UseRedemptionOptions, 'onSuccess' | 'onError'>) {
  const queryClient = useQueryClient();
  const client = isAdmin 
    ? createAdminClient(shopDomain, accessToken!)
    : createStorefrontClient(shopDomain, accessToken);

  return useMutation({
    mutationFn: async (redemptions: Array<{
      customerId: string;
      rewardId: string;
      quantity?: number;
    }>) => {
      const results = await Promise.allSettled(
        redemptions.map(async (redemption) => {
          return client.RedeemReward({
            input: {
              customer_id: redemption.customerId,
              reward_id: redemption.rewardId,
              quantity: redemption.quantity || 1
            }
          });
        })
      );

      return results.map((result, index) => ({
        redemption: redemptions[index],
        result: result.status === 'fulfilled' ? result.value.redeemReward : null,
        error: result.status === 'rejected' ? result.reason : null
      }));
    },
    onSuccess: (results) => {
      // Invalidate all affected customer profiles
      const customerIds = new Set(results.map(r => r.redemption.customerId));
      customerIds.forEach(customerId => {
        queryClient.invalidateQueries({
          queryKey: ['loyaltyProfile', customerId, shopDomain]
        });
        queryClient.invalidateQueries({
          queryKey: ['pointsHistory', customerId, shopDomain]
        });
      });
    },
  });
}

// Hook for redemption validation
export function useRedemptionValidation() {
  const validateRedemption = (
    pointsBalance: number,
    rewardCost: number,
    rewardAvailable: boolean = true
  ) => {
    const errors: string[] = [];
    
    if (!rewardAvailable) {
      errors.push('This reward is currently unavailable');
    }
    
    if (pointsBalance < rewardCost) {
      errors.push(`Insufficient points. Need ${rewardCost}, have ${pointsBalance}`);
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };

  return { validateRedemption };
}
