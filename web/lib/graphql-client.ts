/**
 * GraphQL Client for Storefront & Admin Extensions
 * Type-safe GraphQL client with automatic code generation
 */

import { GraphQLClient } from 'graphql-request';
import { getSdk } from './generated/graphql';

// GraphQL endpoint configuration
const GRAPHQL_ENDPOINT = process.env.NEXT_PUBLIC_GRAPHQL_URL || '/api/loyalty-graphql';

// Create GraphQL client with authentication
export function createGraphQLClient(options: {
  shopDomain?: string;
  accessToken?: string;
  isStorefront?: boolean;
} = {}) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Add shop domain for multi-tenant support
  if (options.shopDomain) {
    headers['X-Shopify-Shop-Domain'] = options.shopDomain;
  }

  // Add authentication for admin or storefront
  if (options.accessToken) {
    if (options.isStorefront) {
      headers['X-Shopify-Storefront-Access-Token'] = options.accessToken;
    } else {
      headers['Authorization'] = `Bearer ${options.accessToken}`;
    }
  }

  const client = new GraphQLClient(GRAPHQL_ENDPOINT, {
    headers,
    errorPolicy: 'all', // Return both data and errors
  });

  return getSdk(client);
}

// Storefront-specific client
export function createStorefrontClient(shopDomain: string, accessToken?: string) {
  return createGraphQLClient({
    shopDomain,
    accessToken,
    isStorefront: true,
  });
}

// Admin-specific client
export function createAdminClient(shopDomain: string, accessToken: string) {
  return createGraphQLClient({
    shopDomain,
    accessToken,
    isStorefront: false,
  });
}

// React hooks for GraphQL operations
export * from './hooks/useLoyaltyProfile';
export * from './hooks/useRewards';
export * from './hooks/usePointsHistory';
export * from './hooks/useRedemption';
