/**
 * React Query Hooks for Admin API
 * Type-safe hooks for admin interface data fetching and mutations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  adminApiClient, 
  adminApiKeys,
  type DashboardOverview,
  type Tier,
  type TierCreate,
  type Reward,
  type RewardCreate,
  type AnalyticsSummary
} from '../admin-api-client';

// Dashboard hooks
export function useDashboardOverview() {
  return useQuery({
    queryKey: adminApiKeys.dashboardOverview(),
    queryFn: () => adminApiClient.getDashboardOverview(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

// Tier management hooks
export function useTiers() {
  return useQuery({
    queryKey: adminApiKeys.tiersList(),
    queryFn: async () => {
      const response = await adminApiClient.getTiers();
      return response.tiers;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });
}

export function useTier(tierId: string) {
  return useQuery({
    queryKey: adminApiKeys.tier(tierId),
    queryFn: async () => {
      const response = await adminApiClient.getTier(tierId);
      return response.tier;
    },
    enabled: !!tierId,
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useCreateTier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tier: TierCreate) => adminApiClient.createTier(tier),
    onSuccess: () => {
      // Invalidate and refetch tiers list
      queryClient.invalidateQueries({ queryKey: adminApiKeys.tiersList() });
      queryClient.invalidateQueries({ queryKey: adminApiKeys.dashboardOverview() });
    },
  });
}

export function useUpdateTier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tierId, updates }: { tierId: string; updates: Partial<TierCreate> }) =>
      adminApiClient.updateTier(tierId, updates),
    onSuccess: (data, variables) => {
      // Update the specific tier in cache
      queryClient.setQueryData(adminApiKeys.tier(variables.tierId), data.tier);
      // Invalidate tiers list to ensure consistency
      queryClient.invalidateQueries({ queryKey: adminApiKeys.tiersList() });
      queryClient.invalidateQueries({ queryKey: adminApiKeys.dashboardOverview() });
    },
  });
}

export function useDeleteTier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tierId: string) => adminApiClient.deleteTier(tierId),
    onSuccess: (data, tierId) => {
      // Remove the tier from cache
      queryClient.removeQueries({ queryKey: adminApiKeys.tier(tierId) });
      // Invalidate tiers list
      queryClient.invalidateQueries({ queryKey: adminApiKeys.tiersList() });
      queryClient.invalidateQueries({ queryKey: adminApiKeys.dashboardOverview() });
    },
  });
}

// Reward management hooks
export function useRewards() {
  return useQuery({
    queryKey: adminApiKeys.rewardsList(),
    queryFn: async () => {
      const response = await adminApiClient.getRewards();
      return response.rewards;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });
}

export function useReward(rewardId: string) {
  return useQuery({
    queryKey: adminApiKeys.reward(rewardId),
    queryFn: async () => {
      const response = await adminApiClient.getReward(rewardId);
      return response.reward;
    },
    enabled: !!rewardId,
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useCreateReward() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reward: RewardCreate) => adminApiClient.createReward(reward),
    onSuccess: () => {
      // Invalidate and refetch rewards list
      queryClient.invalidateQueries({ queryKey: adminApiKeys.rewardsList() });
      queryClient.invalidateQueries({ queryKey: adminApiKeys.dashboardOverview() });
    },
  });
}

export function useUpdateReward() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ rewardId, updates }: { rewardId: string; updates: Partial<RewardCreate> }) =>
      adminApiClient.updateReward(rewardId, updates),
    onSuccess: (data, variables) => {
      // Update the specific reward in cache
      queryClient.setQueryData(adminApiKeys.reward(variables.rewardId), data.reward);
      // Invalidate rewards list to ensure consistency
      queryClient.invalidateQueries({ queryKey: adminApiKeys.rewardsList() });
      queryClient.invalidateQueries({ queryKey: adminApiKeys.dashboardOverview() });
    },
  });
}

export function useDeleteReward() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (rewardId: string) => adminApiClient.deleteReward(rewardId),
    onSuccess: (data, rewardId) => {
      // Remove the reward from cache
      queryClient.removeQueries({ queryKey: adminApiKeys.reward(rewardId) });
      // Invalidate rewards list
      queryClient.invalidateQueries({ queryKey: adminApiKeys.rewardsList() });
      queryClient.invalidateQueries({ queryKey: adminApiKeys.dashboardOverview() });
    },
  });
}

// Analytics hooks
export function useAnalyticsSummary() {
  return useQuery({
    queryKey: adminApiKeys.analyticsSummary(),
    queryFn: () => adminApiClient.getAnalyticsSummary(),
    staleTime: 15 * 60 * 1000, // 15 minutes
    refetchOnWindowFocus: false,
  });
}

// Health check hook
export function useAdminApiHealth() {
  return useQuery({
    queryKey: ['admin-api-health'],
    queryFn: () => adminApiClient.healthCheck(),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Check every minute
    refetchOnWindowFocus: false,
  });
}

// Batch operations hooks
export function useBatchTierOperations() {
  const queryClient = useQueryClient();

  const createMultipleTiers = useMutation({
    mutationFn: async (tiers: TierCreate[]) => {
      const results = await Promise.allSettled(
        tiers.map(tier => adminApiClient.createTier(tier))
      );
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminApiKeys.tiersList() });
      queryClient.invalidateQueries({ queryKey: adminApiKeys.dashboardOverview() });
    },
  });

  const deleteMultipleTiers = useMutation({
    mutationFn: async (tierIds: string[]) => {
      const results = await Promise.allSettled(
        tierIds.map(id => adminApiClient.deleteTier(id))
      );
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminApiKeys.tiersList() });
      queryClient.invalidateQueries({ queryKey: adminApiKeys.dashboardOverview() });
    },
  });

  return {
    createMultipleTiers,
    deleteMultipleTiers,
  };
}

export function useBatchRewardOperations() {
  const queryClient = useQueryClient();

  const createMultipleRewards = useMutation({
    mutationFn: async (rewards: RewardCreate[]) => {
      const results = await Promise.allSettled(
        rewards.map(reward => adminApiClient.createReward(reward))
      );
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminApiKeys.rewardsList() });
      queryClient.invalidateQueries({ queryKey: adminApiKeys.dashboardOverview() });
    },
  });

  const deleteMultipleRewards = useMutation({
    mutationFn: async (rewardIds: string[]) => {
      const results = await Promise.allSettled(
        rewardIds.map(id => adminApiClient.deleteReward(id))
      );
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminApiKeys.rewardsList() });
      queryClient.invalidateQueries({ queryKey: adminApiKeys.dashboardOverview() });
    },
  });

  return {
    createMultipleRewards,
    deleteMultipleRewards,
  };
}

// Optimistic updates helper
export function useOptimisticTierUpdate() {
  const queryClient = useQueryClient();

  return {
    updateTierOptimistically: (tierId: string, updates: Partial<Tier>) => {
      queryClient.setQueryData(
        adminApiKeys.tier(tierId),
        (oldData: Tier | undefined) => {
          if (!oldData) return oldData;
          return { ...oldData, ...updates };
        }
      );
    },
    revertTierUpdate: (tierId: string) => {
      queryClient.invalidateQueries({ queryKey: adminApiKeys.tier(tierId) });
    },
  };
}

export function useOptimisticRewardUpdate() {
  const queryClient = useQueryClient();

  return {
    updateRewardOptimistically: (rewardId: string, updates: Partial<Reward>) => {
      queryClient.setQueryData(
        adminApiKeys.reward(rewardId),
        (oldData: Reward | undefined) => {
          if (!oldData) return oldData;
          return { ...oldData, ...updates };
        }
      );
    },
    revertRewardUpdate: (rewardId: string) => {
      queryClient.invalidateQueries({ queryKey: adminApiKeys.reward(rewardId) });
    },
  };
}
