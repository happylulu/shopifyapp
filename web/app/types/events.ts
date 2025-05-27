export enum EventStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum EventType {
  POINTS_MULTIPLIER = 'points_multiplier',
  BONUS_POINTS = 'bonus_points',
  EXCLUSIVE_DISCOUNT = 'exclusive_discount',
  EARLY_ACCESS = 'early_access',
  VIP_APPRECIATION = 'vip_appreciation',
  RECOVERY_CAMPAIGN = 'recovery_campaign',
  ONBOARDING = 'onboarding',
  SEASONAL = 'seasonal'
}

export enum TargetType {
  VIP_TIER = 'vip_tier',
  AI_SEGMENT = 'ai_segment',
  CUSTOM = 'custom',
  ALL_VIPS = 'all_vips'
}

export interface EventReward {
  type: string;
  value: number;
  description: string;
  max_uses_per_customer?: number;
}

export interface EventTarget {
  type: TargetType;
  values: string[];
  estimated_reach: number;
}

export interface VIPEvent {
  id: string;
  name: string;
  description: string;
  event_type: EventType;
  status: EventStatus;
  targets: EventTarget[];
  rewards: EventReward[];
  start_date: string;
  end_date: string;
  total_participants: number;
  total_rewards_claimed: number;
  total_revenue_generated: number;
  created_at: string;
  updated_at: string;
  created_by: string;
  auto_enroll: boolean;
  send_notifications: boolean;
  require_opt_in: boolean;
  max_participants?: number;
  budget_limit?: number;
  icon: string;
  color: string;
}

export interface CreateEventRequest {
  name: string;
  description: string;
  event_type: EventType;
  targets: EventTarget[];
  rewards: EventReward[];
  start_date: string;
  end_date: string;
  auto_enroll?: boolean;
  send_notifications?: boolean;
  require_opt_in?: boolean;
  max_participants?: number;
  budget_limit?: number;
  icon?: string;
}

export interface UpdateEventRequest {
  name?: string;
  description?: string;
  targets?: EventTarget[];
  rewards?: EventReward[];
  start_date?: string;
  end_date?: string;
  status?: EventStatus;
  auto_enroll?: boolean;
  send_notifications?: boolean;
}

export interface EventAnalytics {
  event_id: string;
  status: EventStatus;
  participants_count: number;
  conversion_rate: number;
  avg_order_value: number;
  total_revenue: number;
  roi: number;
  engagement_rate: number;
  performance_by_target: Record<string, any>;
  daily_metrics: Array<{
    date: string;
    participants: number;
    revenue: number;
    orders: number;
  }>;
}

export interface EventListResponse {
  events: VIPEvent[];
  total: number;
  active_count: number;
  scheduled_count: number;
  draft_count: number;
}

export interface EventCalendarItem {
  id: string;
  name: string;
  event_type: EventType;
  status: EventStatus;
  start_date: string;
  end_date: string;
  targets_summary: string[];
  rewards_summary: string[];
  estimated_reach: number;
  icon: string;
  color: string;
}

export interface AvailableTargets {
  vip_tiers: string[];
  ai_segments: string[];
} 