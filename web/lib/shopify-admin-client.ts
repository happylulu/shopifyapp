/**
 * Shopify Admin API Client
 * Real-time integration with Shopify customer and order data
 */

import { graphql } from './gql';

// GraphQL queries for real Shopify data
export const GET_CUSTOMERS_WITH_ORDERS = graphql(`
  query GetCustomersWithOrders($first: Int!, $query: String) {
    customers(first: $first, query: $query) {
      edges {
        node {
          id
          email
          firstName
          lastName
          phone
          createdAt
          updatedAt
          tags
          ordersCount
          totalSpent
          averageOrderValue
          lastOrder {
            id
            name
            createdAt
            totalPrice
            currencyCode
          }
          addresses {
            city
            province
            country
          }
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
  }
`);

export const GET_CUSTOMER_ORDERS = graphql(`
  query GetCustomerOrders($customerId: ID!, $first: Int!) {
    customer(id: $customerId) {
      id
      orders(first: $first) {
        edges {
          node {
            id
            name
            createdAt
            totalPrice
            currencyCode
            lineItems(first: 10) {
              edges {
                node {
                  id
                  title
                  quantity
                  originalUnitPrice
                  product {
                    id
                    title
                    productType
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`);

export const GET_SHOP_ANALYTICS = graphql(`
  query GetShopAnalytics {
    shop {
      id
      name
      email
      currencyCode
      plan {
        displayName
      }
    }
  }
`);

// Types for enhanced customer data
export interface EnhancedCustomer {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  ordersCount: number;
  totalSpent: string;
  averageOrderValue: string;
  lastOrder?: {
    id: string;
    name: string;
    createdAt: string;
    totalPrice: string;
    currencyCode: string;
  };
  location?: {
    city?: string;
    province?: string;
    country?: string;
  };
  // Loyalty program fields (calculated)
  loyaltyPoints: number;
  loyaltyTier: string;
  pointsToNextTier: number;
  lifetimeValue: number;
  engagementScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  recommendations: string[];
}

// Customer segmentation logic
export function calculateCustomerSegment(customer: any): {
  tier: string;
  points: number;
  nextTier: string;
  pointsToNext: number;
  lifetimeValue: number;
  engagementScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  recommendations: string[];
} {
  const totalSpent = parseFloat(customer.totalSpent || '0');
  const ordersCount = customer.ordersCount || 0;
  const avgOrderValue = parseFloat(customer.averageOrderValue || '0');
  
  // Calculate loyalty points (1 point per dollar spent)
  const points = Math.floor(totalSpent);
  
  // Determine tier based on total spent
  let tier = 'Bronze';
  let nextTier = 'Silver';
  let pointsToNext = 500 - points;
  
  if (totalSpent >= 5000) {
    tier = 'Platinum';
    nextTier = 'Platinum';
    pointsToNext = 0;
  } else if (totalSpent >= 1500) {
    tier = 'Gold';
    nextTier = 'Platinum';
    pointsToNext = 5000 - points;
  } else if (totalSpent >= 500) {
    tier = 'Silver';
    nextTier = 'Gold';
    pointsToNext = 1500 - points;
  }
  
  // Calculate engagement score (0-100)
  const daysSinceLastOrder = customer.lastOrder 
    ? Math.floor((Date.now() - new Date(customer.lastOrder.createdAt).getTime()) / (1000 * 60 * 60 * 24))
    : 365;
  
  const engagementScore = Math.max(0, Math.min(100, 
    (ordersCount * 10) + 
    (avgOrderValue / 10) + 
    Math.max(0, 50 - daysSinceLastOrder)
  ));
  
  // Calculate risk level
  let riskLevel: 'low' | 'medium' | 'high' = 'low';
  if (daysSinceLastOrder > 90) riskLevel = 'high';
  else if (daysSinceLastOrder > 30) riskLevel = 'medium';
  
  // Generate recommendations
  const recommendations: string[] = [];
  if (riskLevel === 'high') {
    recommendations.push('Send win-back campaign');
    recommendations.push('Offer exclusive discount');
  }
  if (pointsToNext > 0 && pointsToNext < 200) {
    recommendations.push(`Only ${pointsToNext} points to ${nextTier} tier!`);
  }
  if (avgOrderValue < 50) {
    recommendations.push('Encourage larger basket size');
  }
  if (ordersCount === 1) {
    recommendations.push('Focus on second purchase');
  }
  
  return {
    tier,
    points,
    nextTier,
    pointsToNext: Math.max(0, pointsToNext),
    lifetimeValue: totalSpent * 1.2, // Estimated LTV
    engagementScore: Math.round(engagementScore),
    riskLevel,
    recommendations,
  };
}

// Enhanced customer data processor
export function enhanceCustomerData(shopifyCustomers: any[]): EnhancedCustomer[] {
  return shopifyCustomers.map(customer => {
    const segment = calculateCustomerSegment(customer);
    
    return {
      id: customer.id,
      email: customer.email,
      firstName: customer.firstName || '',
      lastName: customer.lastName || '',
      phone: customer.phone,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
      tags: customer.tags || [],
      ordersCount: customer.ordersCount,
      totalSpent: customer.totalSpent,
      averageOrderValue: customer.averageOrderValue,
      lastOrder: customer.lastOrder,
      location: customer.addresses?.[0] ? {
        city: customer.addresses[0].city,
        province: customer.addresses[0].province,
        country: customer.addresses[0].country,
      } : undefined,
      loyaltyPoints: segment.points,
      loyaltyTier: segment.tier,
      pointsToNextTier: segment.pointsToNext,
      lifetimeValue: segment.lifetimeValue,
      engagementScore: segment.engagementScore,
      riskLevel: segment.riskLevel,
      recommendations: segment.recommendations,
    };
  });
}

// Utility functions
export function formatCurrency(amount: string | number, currency = 'USD'): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(num);
}

export function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(dateString));
}

export function getTimeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return formatDate(dateString);
}
