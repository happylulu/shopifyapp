/**
 * React Hook for Rewards Management
 * Provides type-safe access to rewards data and redemption functionality
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createStorefrontClient, createAdminClient } from '../graphql-client';
import type { 
  GetAvailableRewardsQuery,
  GetAvailableRewardsQueryVariables,
  Reward
} from '../generated/graphql';

interface UseRewardsOptions {
  shopDomain: string;
  accessToken?: string;
  isAdmin?: boolean;
  customerId?: string;
  maxPoints?: number;
  category?: string;
}

export function useRewards({
  shopDomain,
  accessToken,
  isAdmin = false,
  customerId,
  maxPoints,
  category
}: UseRewardsOptions) {
  const client = isAdmin 
    ? createAdminClient(shopDomain, accessToken!)
    : createStorefrontClient(shopDomain, accessToken);

  return useQuery({
    queryKey: ['rewards', shopDomain, customerId, maxPoints, category],
    queryFn: async () => {
      const result = await client.GetAvailableRewards({ 
        customerId, 
        maxPoints, 
        category 
      });
      return result.availableRewards;
    },
    enabled: !!shopDomain,
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });
}

// Hook for filtering rewards by customer's points balance
export function useAffordableRewards({
  shopDomain,
  accessToken,
  customerId,
  pointsBalance,
  isAdmin = false
}: UseRewardsOptions & { pointsBalance?: number }) {
  const { data: allRewards, ...query } = useRewards({
    shopDomain,
    accessToken,
    isAdmin,
    customerId
  });

  const affordableRewards = allRewards?.filter(
    reward => pointsBalance ? reward.points_cost <= pointsBalance : true
  ) || [];

  return {
    data: affordableRewards,
    ...query
  };
}

// Hook for reward categories
export function useRewardCategories({
  shopDomain,
  accessToken,
  isAdmin = false
}: Omit<UseRewardsOptions, 'customerId' | 'maxPoints' | 'category'>) {
  const { data: rewards } = useRewards({
    shopDomain,
    accessToken,
    isAdmin
  });

  const categories = rewards?.reduce((acc, reward) => {
    if (reward.category && !acc.includes(reward.category)) {
      acc.push(reward.category);
    }
    return acc;
  }, [] as string[]) || [];

  return { categories };
}
