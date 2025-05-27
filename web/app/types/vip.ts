// VIP Tier Types
export enum VIPTierLevel {
  BRONZE = 'bronze',
  SILVER = 'silver',
  GOLD = 'gold',
  PLATINUM = 'platinum'
}

export enum QualificationCriteria {
  TOTAL_SPENT = 'total_spent',
  POINTS_EARNED = 'points_earned',
  ORDERS_COUNT = 'orders_count',
  MANUAL = 'manual',
  HYBRID = 'hybrid'
}

export enum BenefitType {
  POINTS_MULTIPLIER = 'points_multiplier',
  EXCLUSIVE_DISCOUNT = 'exclusive_discount',
  FREE_SHIPPING = 'free_shipping',
  EARLY_ACCESS = 'early_access',
  BIRTHDAY_REWARD = 'birthday_reward',
  PRIORITY_SUPPORT = 'priority_support',
  EXCLUSIVE_PRODUCTS = 'exclusive_products',
  CUSTOM_BENEFIT = 'custom_benefit'
}

export interface VIPBenefit {
  id: string;
  type: BenefitType;
  name: string;
  description: string;
  value: number | string | boolean;
  icon: string;
  is_active: boolean;
  metadata?: Record<string, any>;
}

export interface VIPTier {
  id: string;
  level: VIPTierLevel;
  name: string;
  description: string;
  color: string;
  icon: string;
  qualification_criteria: QualificationCriteria;
  min_spent?: number;
  min_points?: number;
  min_orders?: number;
  qualification_period_days: number;
  benefits: VIPBenefit[];
  points_multiplier: number;
  retention_period_days: number;
  grace_period_days: number;
  badge_url?: string;
  welcome_message: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface VIPMember {
  id: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  current_tier: VIPTierLevel;
  tier_started_at: string;
  tier_expires_at?: string;
  total_spent: number;
  total_points: number;
  total_orders: number;
  spent_this_period: number;
  points_this_period: number;
  orders_this_period: number;
  next_tier?: VIPTierLevel;
  progress_to_next_tier: number;
  amount_to_next_tier?: number;
  benefits_used: Record<string, number>;
  lifetime_value: number;
  is_active: boolean;
  joined_vip_at: string;
  last_activity_at: string;
  notes?: string;
}

export interface VIPProgramConfig {
  shop_domain: string;
  program_name: string;
  is_active: boolean;
  tiers: VIPTier[];
  auto_upgrade: boolean;
  auto_downgrade: boolean;
  send_tier_notifications: boolean;
  send_benefit_reminders: boolean;
  show_progress_bar: boolean;
  show_benefits_page: boolean;
  created_at: string;
  updated_at: string;
}

export interface VIPAnalytics {
  total_vip_members: number;
  members_by_tier: Record<VIPTierLevel, number>;
  total_vip_revenue: number;
  avg_vip_order_value: number;
  vip_retention_rate: number;
  benefits_redemption_rate: number;
  tier_progression_rate: number;
  new_vip_members_30d: number;
  vip_revenue_30d: number;
  top_vip_members: Array<{
    id: string;
    name: string;
    tier: string;
    lifetime_value: number;
    orders: number;
  }>;
  most_used_benefits: Array<{
    benefit: string;
    usage_count: number;
    tier: string;
  }>;
  generated_at: string;
}

// API Request/Response types
export interface CreateVIPMemberRequest {
  customer_id: string;
  customer_name: string;
  customer_email: string;
  tier_level: VIPTierLevel;
  manual_assignment?: boolean;
  notes?: string;
}

export interface UpdateVIPTierRequest {
  name?: string;
  description?: string;
  min_spent?: number;
  min_points?: number;
  min_orders?: number;
  benefits?: VIPBenefit[];
  points_multiplier?: number;
  is_active?: boolean;
}

// Page state
export interface VIPPageState {
  activeTab: 'overview' | 'members' | 'tiers' | 'analytics';
  config: VIPProgramConfig | null;
  members: VIPMember[];
  analytics: VIPAnalytics | null;
  loading: boolean;
  error: string | null;
  selectedTier: VIPTierLevel | null;
} 