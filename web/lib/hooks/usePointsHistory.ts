/**
 * React Hook for Points History Management
 * Provides type-safe access to customer points transaction history
 */

import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { createStorefrontClient, createAdminClient } from '../graphql-client';
import type { 
  GetPointsHistoryQuery,
  GetPointsHistoryQueryVariables,
  PointsTransaction
} from '../generated/graphql';

interface UsePointsHistoryOptions {
  customerId: string;
  shopDomain: string;
  accessToken?: string;
  isAdmin?: boolean;
  limit?: number;
  offset?: number;
}

export function usePointsHistory({
  customerId,
  shopDomain,
  accessToken,
  isAdmin = false,
  limit = 20,
  offset = 0
}: UsePointsHistoryOptions) {
  const client = isAdmin 
    ? createAdminClient(shopDomain, accessToken!)
    : createStorefrontClient(shopDomain, accessToken);

  return useQuery({
    queryKey: ['pointsHistory', customerId, shopDomain, limit, offset],
    queryFn: async () => {
      const result = await client.GetPointsHistory({ 
        customerId, 
        limit, 
        offset 
      });
      return result.pointsHistory;
    },
    enabled: !!customerId && !!shopDomain,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
  });
}

// Hook for infinite scrolling points history
export function useInfinitePointsHistory({
  customerId,
  shopDomain,
  accessToken,
  isAdmin = false,
  limit = 20
}: Omit<UsePointsHistoryOptions, 'offset'>) {
  const client = isAdmin 
    ? createAdminClient(shopDomain, accessToken!)
    : createStorefrontClient(shopDomain, accessToken);

  return useInfiniteQuery({
    queryKey: ['infinitePointsHistory', customerId, shopDomain, limit],
    queryFn: async ({ pageParam = 0 }) => {
      const result = await client.GetPointsHistory({ 
        customerId, 
        limit, 
        offset: pageParam 
      });
      return {
        transactions: result.pointsHistory,
        nextOffset: result.pointsHistory.length === limit ? pageParam + limit : undefined
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextOffset,
    enabled: !!customerId && !!shopDomain,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

// Hook for points history analytics
export function usePointsAnalytics({
  customerId,
  shopDomain,
  accessToken,
  isAdmin = false
}: Omit<UsePointsHistoryOptions, 'limit' | 'offset'>) {
  const { data: transactions } = usePointsHistory({
    customerId,
    shopDomain,
    accessToken,
    isAdmin,
    limit: 100 // Get more data for analytics
  });

  const analytics = transactions?.reduce((acc, transaction) => {
    if (transaction.transaction_type === 'earned') {
      acc.totalEarned += transaction.amount;
      acc.earnedTransactions += 1;
    } else if (transaction.transaction_type === 'redeemed') {
      acc.totalRedeemed += Math.abs(transaction.amount);
      acc.redeemedTransactions += 1;
    }
    return acc;
  }, {
    totalEarned: 0,
    totalRedeemed: 0,
    earnedTransactions: 0,
    redeemedTransactions: 0
  }) || {
    totalEarned: 0,
    totalRedeemed: 0,
    earnedTransactions: 0,
    redeemedTransactions: 0
  };

  return {
    analytics: {
      ...analytics,
      netPoints: analytics.totalEarned - analytics.totalRedeemed,
      totalTransactions: analytics.earnedTransactions + analytics.redeemedTransactions
    }
  };
}
