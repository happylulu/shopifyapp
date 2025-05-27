/**
 * TypeScript type definitions for the Loyalty Program
 * 
 * These types should match the JSON schema in loyalty.schema.json
 * and the FastAPI backend models.
 */

export interface CustomerProfile {
  id: string;
  shopify_customer_id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  points_balance: number;
  current_tier_name?: string;
  total_points_earned: number;
  total_points_redeemed: number;
  created_at: string;
  updated_at: string;
}

export interface Reward {
  id: string;
  name: string;
  description: string;
  points_cost: number;
  reward_type: RewardType;
  is_active: boolean;
  usage_limit?: number;
  usage_count?: number;
  created_at: string;
}

export interface Tier {
  id: string;
  name: string;
  tier_level: number;
  min_points_required: number;
  description?: string;
  benefits?: Record<string, any>;
}

export interface PointTransaction {
  id: string;
  customer_profile_id: string;
  amount: number;
  transaction_type: TransactionType;
  source: TransactionSource;
  reason: string;
  reference_id?: string;
  created_at: string;
}

export interface RedemptionLog {
  id: string;
  customer_profile_id: string;
  reward_definition_id: string;
  points_cost: number;
  discount_code?: string;
  status: RedemptionStatus;
  created_at: string;
}

// Enums
export type RewardType = 'discount' | 'free_shipping' | 'product' | 'experience';

export type TransactionType = 'earned' | 'redeemed' | 'expired' | 'adjusted';

export type TransactionSource = 
  | 'purchase' 
  | 'signup' 
  | 'referral' 
  | 'review' 
  | 'birthday' 
  | 'manual' 
  | 'redemption'
  | 'expiration';

export type RedemptionStatus = 'pending' | 'completed' | 'failed' | 'cancelled';

// Request/Response types
export interface AdjustPointsRequest {
  amount: number;
  reason: string;
}

export interface CreateRewardRequest {
  name: string;
  description?: string;
  points_cost: number;
  reward_type: RewardType;
  usage_limit?: number;
}

export interface CreateTierRequest {
  name: string;
  tier_level: number;
  min_points_required: number;
  description?: string;
}

export interface CreateProfileRequest {
  shopify_customer_id: string;
  email: string;
  first_name?: string;
  last_name?: string;
}

export interface RedeemRewardRequest {
  customer_id: string;
  reward_id: string;
  points_cost: number;
  discount_code?: string;
  customer_email?: string;
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  has_next: boolean;
  has_prev: boolean;
}

// Component Props types
export interface PointsAndTierCardProps {
  customerId: string;
}

export interface RewardsListProps {
  customerPoints: number;
  onRedeemClick: (reward: Reward) => void;
}

export interface RedeemModalProps {
  reward: Reward | null;
  customerPoints: number;
  customerId: string;
  isOpen: boolean;
  onClose: () => void;
  onRedeemSuccess: (discountCode?: string) => void;
}

export interface LoyaltyDashboardProps {
  customerId: string;
}

// Utility types
export interface TierProgress {
  currentTier: Tier;
  nextTier: Tier | null;
  progressPercent: number;
  pointsToNext: number;
}

export interface RewardAvailability {
  canRedeem: boolean;
  reason?: string;
  badge: {
    text: string;
    tone: 'success' | 'critical' | 'attention' | 'subdued' | 'info';
  };
}

// Shopify-specific types
export interface ShopifyCustomer {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
}

export interface ShopifyDiscount {
  id: string;
  title: string;
  code: string;
  startsAt: string;
  endsAt?: string;
  usageLimit?: number;
  usageCount: number;
  status: 'active' | 'expired' | 'scheduled';
}

// App Bridge types
export interface AppBridgeToast {
  show: (message: string, options?: { 
    duration?: number; 
    isError?: boolean 
  }) => void;
}

export interface AppBridgeUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  accountOwner: boolean;
}

// Error types
export interface LoyaltyError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

export class InsufficientPointsError extends Error {
  constructor(required: number, available: number) {
    super(`Insufficient points: ${required} required, ${available} available`);
    this.name = 'InsufficientPointsError';
  }
}

export class RewardNotFoundError extends Error {
  constructor(rewardId: string) {
    super(`Reward not found: ${rewardId}`);
    this.name = 'RewardNotFoundError';
  }
}

export class CustomerNotFoundError extends Error {
  constructor(customerId: string) {
    super(`Customer not found: ${customerId}`);
    this.name = 'CustomerNotFoundError';
  }
}
