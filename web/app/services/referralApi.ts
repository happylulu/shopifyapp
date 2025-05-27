// ============================================================================
// REFERRAL API CLIENT SERVICE
// Handles all API communication with type safety and error handling
// ============================================================================

import { SocialPlatform } from '../types/referrals';
import type {
  ReferralLinkConfig,
  SocialSharingConfig, 
  ReferralLink,
  ReferralAnalytics,
  CreateReferralLinkRequest,
  UpdateSocialConfigRequest,
  UpdateLinkConfigRequest,
  ReferralLinkResponse,
  AnalyticsResponse,
  ConfigResponse,
  SharingMessageResponse,
  ApiResponse
} from '../types/referrals';

class ReferralApiService {
  private baseUrl: string;
  private headers: HeadersInit;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    this.headers = {
      'Content-Type': 'application/json',
      'X-Shopify-Shop-Domain': 'demo.myshopify.com' // In real app, get from session
    };
  }

  /**
   * Generic fetch wrapper with error handling
   */
  private async fetchApi<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: this.headers,
        ...options,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`API Error for ${endpoint}:`, error);
      throw error instanceof Error ? error : new Error('Unknown API error');
    }
  }

  // ============================================================================
  // LINK CONFIGURATION ENDPOINTS
  // ============================================================================

  /**
   * Get referral link configuration
   */
  async getLinkConfig(): Promise<ReferralLinkConfig> {
    const response = await this.fetchApi<ConfigResponse<ReferralLinkConfig>>('/referrals/link-config');
    return response.config;
  }

  /**
   * Update referral link configuration
   */
  async updateLinkConfig(config: UpdateLinkConfigRequest): Promise<ReferralLinkConfig> {
    const response = await this.fetchApi<ConfigResponse<ReferralLinkConfig>>('/referrals/link-config', {
      method: 'PUT',
      body: JSON.stringify(config),
    });
    return response.config;
  }

  // ============================================================================
  // SOCIAL CONFIGURATION ENDPOINTS
  // ============================================================================

  /**
   * Get social sharing configuration
   */
  async getSocialConfig(): Promise<SocialSharingConfig> {
    const response = await this.fetchApi<ConfigResponse<SocialSharingConfig>>('/referrals/social-config');
    return response.config;
  }

  /**
   * Update social sharing configuration
   */
  async updateSocialConfig(config: UpdateSocialConfigRequest): Promise<SocialSharingConfig> {
    const response = await this.fetchApi<ConfigResponse<SocialSharingConfig>>('/referrals/social-config', {
      method: 'PUT',
      body: JSON.stringify(config),
    });
    return response.config;
  }

  // ============================================================================
  // REFERRAL LINK MANAGEMENT
  // ============================================================================

  /**
   * Create a new referral link
   */
  async createReferralLink(request: CreateReferralLinkRequest): Promise<ReferralLink> {
    const response = await this.fetchApi<ReferralLinkResponse>('/referrals/links', {
      method: 'POST',
      body: JSON.stringify(request),
    });

    if (!response.success || !response.referral_link) {
      throw new Error(response.error || 'Failed to create referral link');
    }

    return response.referral_link;
  }

  /**
   * Get referral links for a specific customer
   */
  async getCustomerReferralLinks(customerId: string): Promise<ReferralLink[]> {
    const response = await this.fetchApi<ApiResponse<ReferralLink[]>>(`/referrals/links?customer_id=${customerId}`);
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch referral links');
    }

    return response.data || [];
  }

  /**
   * Get platform-specific sharing message
   */
  async getSharingMessage(linkId: string, platform: SocialPlatform): Promise<string> {
    const response = await this.fetchApi<SharingMessageResponse>(
      `/referrals/sharing-message/${linkId}?platform=${platform}`
    );

    if (!response.success) {
      throw new Error('Failed to get sharing message');
    }

    return response.message;
  }

  /**
   * Deactivate a referral link
   */
  async deactivateReferralLink(linkId: string): Promise<void> {
    const response = await this.fetchApi<ApiResponse>(`/referrals/links/${linkId}`, {
      method: 'DELETE',
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to deactivate referral link');
    }
  }

  // ============================================================================
  // TRACKING ENDPOINTS
  // ============================================================================

  /**
   * Track a referral link click
   */
  async trackReferralClick(
    referralCode: string,
    utmSource?: string,
    utmMedium?: string,
    utmCampaign?: string
  ): Promise<string> {
    const params = new URLSearchParams({
      referral_code: referralCode,
      ...(utmSource && { utm_source: utmSource }),
      ...(utmMedium && { utm_medium: utmMedium }),
      ...(utmCampaign && { utm_campaign: utmCampaign }),
    });

    const response = await this.fetchApi<ApiResponse<{ click_id: string }>>(
      '/referrals/clicks',
      {
        method: 'POST',
        body: JSON.stringify(Object.fromEntries(params)),
      }
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to track referral click');
    }

    return response.data.click_id;
  }

  /**
   * Mark a referral as converted
   */
  async markReferralConversion(
    referralCode: string,
    orderId: string,
    orderValue: number
  ): Promise<void> {
    const response = await this.fetchApi<ApiResponse>('/referrals/conversions', {
      method: 'POST',
      body: JSON.stringify({
        referral_code: referralCode,
        order_id: orderId,
        order_value: orderValue,
      }),
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to mark conversion');
    }
  }

  // ============================================================================
  // ANALYTICS ENDPOINTS
  // ============================================================================

  /**
   * Get referral analytics
   */
  async getAnalytics(days = 30): Promise<ReferralAnalytics> {
    const response = await this.fetchApi<AnalyticsResponse>(`/referrals/analytics?days=${days}`);

    if (!response.success || !response.analytics) {
      throw new Error(response.error || 'Failed to fetch analytics');
    }

    return response.analytics;
  }

  // ============================================================================
  // UTILITY ENDPOINTS
  // ============================================================================

  /**
   * Validate a referral code
   */
  async validateReferralCode(referralCode: string): Promise<boolean> {
    try {
      const response = await this.fetchApi<ApiResponse<{ valid: boolean }>>(
        `/referrals/validate/${referralCode}`
      );
      return response.data?.valid || false;
    } catch (error) {
      console.warn('Error validating referral code:', error);
      return false;
    }
  }

  /**
   * Check API health
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.fetchApi<{ status: string }>('/health');
      return response.status === 'healthy';
    } catch (error) {
      console.warn('Health check failed:', error);
      return false;
    }
  }
}

// ============================================================================
// SOCIAL PLATFORM CONFIGURATIONS
// ============================================================================

export const socialPlatformConfigs = {
  [SocialPlatform.FACEBOOK]: {
    platform: SocialPlatform.FACEBOOK,
    name: 'Facebook',
    icon: 'facebook',
    color: '#1877f2',
    shareUrl: (url: string, message: string) => 
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(message)}`,
  },
  [SocialPlatform.TWITTER]: {
    platform: SocialPlatform.TWITTER,
    name: 'Twitter',
    icon: 'twitter',
    color: '#1da1f2',
    shareUrl: (url: string, message: string) => 
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(url)}`,
  },
  [SocialPlatform.INSTAGRAM]: {
    platform: SocialPlatform.INSTAGRAM,
    name: 'Instagram',
    icon: 'instagram',
    color: '#e4405f',
    shareUrl: (url: string, message: string) => 
      `https://www.instagram.com/?url=${encodeURIComponent(url)}`, // Instagram doesn't support direct sharing
  },
  [SocialPlatform.LINKEDIN]: {
    platform: SocialPlatform.LINKEDIN,
    name: 'LinkedIn',
    icon: 'linkedin',
    color: '#0a66c2',
    shareUrl: (url: string, message: string) => 
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
  },
  [SocialPlatform.EMAIL]: {
    platform: SocialPlatform.EMAIL,
    name: 'Email',
    icon: 'email',
    color: '#34495e',
    shareUrl: (url: string, message: string) => 
      `mailto:?subject=Check out this amazing store!&body=${encodeURIComponent(`${message}\n\n${url}`)}`,
  },
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Copy text to clipboard with fallback
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const success = document.execCommand('copy');
      textArea.remove();
      return success;
    }
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}

/**
 * Format currency values
 */
export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

/**
 * Format percentage values
 */
export function formatPercentage(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Generate a short ID for UI purposes
 */
export function generateShortId(): string {
  return Math.random().toString(36).substr(2, 9);
}

// Export singleton instance
export const referralApi = new ReferralApiService();
export default referralApi; 