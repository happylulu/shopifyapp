export type InsightType = 'opportunity' | 'warning' | 'optimization' | 'trend';

export type ActionType = 
  | 'award_points' 
  | 'send_email' 
  | 'create_segment' 
  | 'offer_discount' 
  | 'referral_invite';

export type CustomerSegment = 
  | 'high_value'
  | 'at_risk'
  | 'frequent_browsers'
  | 'weekend_shoppers'
  | 'rising_stars'
  | 'new_customers'
  | 'dormant'
  | 'vip';

export interface CustomerInsight {
  customer_id: string;
  customer_name: string;
  customer_email: string;
  segment: CustomerSegment;
  growth_percentage: number;
  orders_count: number;
  total_spent: number;
  last_order_date: string;
  risk_score?: number;
  engagement_score: number;
  predicted_ltv: number;
  recommended_actions: string[];
}

export interface AIOpportunity {
  id: string;
  type: InsightType;
  title: string;
  description: string;
  impact_score: number; // 0-100
  confidence: number;   // 0-1
  affected_customers: CustomerInsight[];
  recommended_action: string;
  potential_revenue: number;
  effort_level: 'low' | 'medium' | 'high';
  created_at: string;
  expires_at?: string;
}

export interface SegmentAnalytics {
  segment: CustomerSegment;
  name: string;
  description: string;
  customer_count: number;
  percentage: number;
  avg_order_value: number;
  total_revenue: number;
  growth_rate: number;
  color: string;
  icon: string;
}

export interface AIInsightsResponse {
  success: boolean;
  opportunities: AIOpportunity[];
  segments: SegmentAnalytics[];
  total_customers: number;
  insights_generated_at: string;
  next_update_at: string;
}

export interface CreateSegmentRequest {
  name: string;
  description: string;
  criteria: Record<string, any>;
  auto_update?: boolean;
}

export interface ExecuteActionRequest {
  opportunity_id: string;
  action_type: ActionType;
  customer_ids: string[];
  parameters?: Record<string, any>;
}

export interface AIPerformanceMetrics {
  total_opportunities_identified: number;
  opportunities_acted_upon: number;
  success_rate: number;
  revenue_generated: number;
  customers_engaged: number;
  avg_response_time: number;
  last_30_days_performance: Record<string, number>;
}

export interface AIPageState {
  insights: AIInsightsResponse | null;
  performance: AIPerformanceMetrics | null;
  loading: boolean;
  error: string | null;
  selectedOpportunity: AIOpportunity | null;
  refreshing: boolean;
} 