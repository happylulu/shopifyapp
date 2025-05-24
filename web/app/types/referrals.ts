// ============================================================================
// REFERRAL SYSTEM TYPES
// Matches backend Pydantic models for type safety
// ============================================================================

export enum SocialPlatform {
  FACEBOOK = "facebook",
  TWITTER = "twitter", 
  INSTAGRAM = "instagram",
  LINKEDIN = "linkedin",
  EMAIL = "email"
}

export interface ReferralLinkConfig {
  shop_domain: string;
  custom_slug: string;
  use_utm_parameters: boolean;
  use_url_shortener: boolean;
  created_at: string;
  updated_at: string;
}

export interface SocialSharingConfig {
  shop_domain: string;
  enabled: boolean;
  platforms: SocialPlatform[];
  default_message: string;
  use_platform_specific: boolean;
  platform_messages: Record<SocialPlatform, string>;
  created_at: string;
  updated_at: string;
}

export interface ReferralLink {
  id: string;
  shop_domain: string;
  customer_id: string;
  customer_name: string;
  referral_code: string;
  full_url: string;
  clicks: number;
  conversions: number;
  revenue_generated: number;
  is_active: boolean;
  created_at: string;
  expires_at?: string;
}

export interface ReferralClick {
  id: string;
  referral_link_id: string;
  ip_address: string;
  user_agent: string;
  platform?: SocialPlatform;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  converted: boolean;
  order_id?: string;
  timestamp: string;
}

export interface ReferralAnalytics {
  shop_domain: string;
  date: string;
  total_links: number;
  total_clicks: number;
  total_conversions: number;
  conversion_rate: number;
  revenue_today: number;
  top_referrers: Array<{
    name: string;
    clicks: number;
    conversions: number;
    revenue: number;
  }>;
}

// ============================================================================
// API REQUEST TYPES
// ============================================================================

export interface CreateReferralLinkRequest {
  customer_id: string;
  customer_name: string;
  custom_message?: string;
}

export interface UpdateSocialConfigRequest {
  enabled?: boolean;
  platforms?: SocialPlatform[];
  default_message?: string;
  use_platform_specific?: boolean;
  platform_messages?: Record<SocialPlatform, string>;
}

export interface UpdateLinkConfigRequest {
  custom_slug?: string;
  use_utm_parameters?: boolean;
  use_url_shortener?: boolean;
}

// ============================================================================
// API RESPONSE TYPES  
// ============================================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ReferralLinkResponse {
  success: boolean;
  referral_link?: ReferralLink;
  error?: string;
}

export interface AnalyticsResponse {
  success: boolean;
  analytics?: ReferralAnalytics;
  error?: string;
}

export interface ConfigResponse<T> {
  success: boolean;
  config: T;
}

export interface SharingMessageResponse {
  success: boolean;
  message: string;
  platform: SocialPlatform;
}

// ============================================================================
// UI STATE TYPES
// ============================================================================

export interface ReferralFormData {
  customerName: string;
  customMessage: string;
}

export interface LinkConfigFormData {
  customSlug: string;
  useUtmParameters: boolean;
  useUrlShortener: boolean;
}

export interface SocialConfigFormData {
  enabled: boolean;
  platforms: SocialPlatform[];
  defaultMessage: string;
  usePlatformSpecific: boolean;
  platformMessages: Record<SocialPlatform, string>;
}

export interface ReferralPageState {
  activeTab: 'link-config' | 'social-config' | 'analytics' | 'links';
  linkConfig: ReferralLinkConfig | null;
  socialConfig: SocialSharingConfig | null;
  analytics: ReferralAnalytics | null;
  referralLinks: ReferralLink[];
  loading: boolean;
  error: string | null;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export interface SocialPlatformConfig {
  platform: SocialPlatform;
  name: string;
  icon: string;
  color: string;
  shareUrl: (url: string, message: string) => string;
}

export interface ReferralMetrics {
  totalClicks: number;
  totalConversions: number;
  conversionRate: number;
  totalRevenue: number;
  averageOrderValue: number;
  topReferrer: string;
}

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';
export type TabKey = 'link-config' | 'social-config' | 'analytics' | 'links'; 