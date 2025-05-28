/**
 * Admin API Client
 * Type-safe client for admin API endpoints
 */

// Types for admin API
export interface DashboardOverview {
  total_members: number;
  active_members: number;
  points_issued: number;
  rewards_redeemed: number;
  conversion_rate: number;
  average_order_value: number;
  recent_activity: Array<{
    id: string;
    type: string;
    customer: string;
    points: number;
    reason: string;
    timestamp: string;
  }>;
  tier_distribution: Array<{
    tier: string;
    members: number;
    percentage: number;
  }>;
  top_rewards: Array<{
    name: string;
    redemptions: number;
    points_cost: number;
  }>;
}

export interface Tier {
  id: string;
  name: string;
  level: number;
  min_points_required: number;
  description: string;
  benefits: string[];
  color: string;
  is_active: boolean;
  member_count: number;
  created_at: string;
  updated_at?: string;
}

export interface TierCreate {
  name: string;
  min_points_required: number;
  description: string;
  benefits: string[];
  color: string;
  is_active: boolean;
}

export interface Reward {
  id: string;
  name: string;
  description: string;
  points_cost: number;
  reward_type: string;
  value: number;
  category: string;
  is_active: boolean;
  redemption_count: number;
  min_order_value?: number;
  max_uses?: number;
  expiry_days?: number;
  terms_and_conditions?: string;
  created_at: string;
  updated_at?: string;
}

export interface RewardCreate {
  name: string;
  description: string;
  points_cost: number;
  reward_type: string;
  value: number;
  category: string;
  is_active: boolean;
  min_order_value?: number;
  max_uses?: number;
  expiry_days?: number;
  terms_and_conditions?: string;
}

export interface AnalyticsSummary {
  period: string;
  metrics: {
    new_members: number;
    points_earned: number;
    points_redeemed: number;
    rewards_redeemed: number;
    tier_upgrades: number;
    engagement_rate: number;
  };
  trends: {
    member_growth: number;
    points_velocity: number;
    redemption_rate: number;
  };
}

// Admin API Client Class
export class AdminApiClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl: string = 'http://localhost:8002', apiKey: string = 'dev-key') {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  // Dashboard endpoints
  async getDashboardOverview(): Promise<DashboardOverview> {
    return this.request<DashboardOverview>('/admin/dashboard/overview');
  }

  // Tier management endpoints
  async getTiers(): Promise<{ tiers: Tier[] }> {
    return this.request<{ tiers: Tier[] }>('/admin/tiers');
  }

  async createTier(tier: TierCreate): Promise<{ tier: Tier }> {
    return this.request<{ tier: Tier }>('/admin/tiers', {
      method: 'POST',
      body: JSON.stringify(tier),
    });
  }

  async getTier(tierId: string): Promise<{ tier: Tier }> {
    return this.request<{ tier: Tier }>(`/admin/tiers/${tierId}`);
  }

  async updateTier(tierId: string, updates: Partial<TierCreate>): Promise<{ tier: Tier }> {
    return this.request<{ tier: Tier }>(`/admin/tiers/${tierId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteTier(tierId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/admin/tiers/${tierId}`, {
      method: 'DELETE',
    });
  }

  // Reward management endpoints
  async getRewards(): Promise<{ rewards: Reward[] }> {
    return this.request<{ rewards: Reward[] }>('/admin/rewards');
  }

  async createReward(reward: RewardCreate): Promise<{ reward: Reward }> {
    return this.request<{ reward: Reward }>('/admin/rewards', {
      method: 'POST',
      body: JSON.stringify(reward),
    });
  }

  async getReward(rewardId: string): Promise<{ reward: Reward }> {
    return this.request<{ reward: Reward }>(`/admin/rewards/${rewardId}`);
  }

  async updateReward(rewardId: string, updates: Partial<RewardCreate>): Promise<{ reward: Reward }> {
    return this.request<{ reward: Reward }>(`/admin/rewards/${rewardId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteReward(rewardId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/admin/rewards/${rewardId}`, {
      method: 'DELETE',
    });
  }

  // Analytics endpoints
  async getAnalyticsSummary(): Promise<AnalyticsSummary> {
    return this.request<AnalyticsSummary>('/admin/analytics/summary');
  }

  // Health check
  async healthCheck(): Promise<{ status: string; service: string; timestamp: string }> {
    return this.request<{ status: string; service: string; timestamp: string }>('/health');
  }
}

// Default client instance
export const adminApiClient = new AdminApiClient();

// React Query hooks for admin API
export const adminApiKeys = {
  all: ['admin'] as const,
  dashboard: () => [...adminApiKeys.all, 'dashboard'] as const,
  dashboardOverview: () => [...adminApiKeys.dashboard(), 'overview'] as const,
  tiers: () => [...adminApiKeys.all, 'tiers'] as const,
  tiersList: () => [...adminApiKeys.tiers(), 'list'] as const,
  tier: (id: string) => [...adminApiKeys.tiers(), 'detail', id] as const,
  rewards: () => [...adminApiKeys.all, 'rewards'] as const,
  rewardsList: () => [...adminApiKeys.rewards(), 'list'] as const,
  reward: (id: string) => [...adminApiKeys.rewards(), 'detail', id] as const,
  analytics: () => [...adminApiKeys.all, 'analytics'] as const,
  analyticsSummary: () => [...adminApiKeys.analytics(), 'summary'] as const,
};

// Error handling utilities
export class AdminApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'AdminApiError';
  }
}

export function isAdminApiError(error: unknown): error is AdminApiError {
  return error instanceof AdminApiError;
}

// Utility functions
export function formatPointsValue(points: number): string {
  return points.toLocaleString();
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function formatRewardValue(reward: Reward): string {
  switch (reward.reward_type) {
    case 'discount_percentage':
      return `${reward.value}% off`;
    case 'discount_fixed':
      return `$${reward.value} off`;
    case 'store_credit':
      return `$${reward.value} credit`;
    case 'free_shipping':
      return 'Free shipping';
    case 'product':
      return 'Free product';
    default:
      return reward.value.toString();
  }
}
