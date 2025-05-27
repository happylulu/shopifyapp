import { 
  VIPProgramConfig, 
  VIPTier, 
  VIPMember, 
  VIPAnalytics,
  CreateVIPMemberRequest,
  UpdateVIPTierRequest,
  VIPTierLevel
} from '../types/vip';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

class VIPApi {
  private async fetchWithAuth(url: string, options: RequestInit = {}) {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Shop-Domain': 'demo.myshopify.com',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    return response.json();
  }

  // Configuration
  async getConfig(): Promise<VIPProgramConfig> {
    return this.fetchWithAuth('/vip/config');
  }

  async updateConfig(updates: Partial<VIPProgramConfig>): Promise<{ success: boolean; config: VIPProgramConfig }> {
    return this.fetchWithAuth('/vip/config', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  // Tiers
  async getTiers(): Promise<{ success: boolean; tiers: VIPTier[] }> {
    return this.fetchWithAuth('/vip/tiers');
  }

  async getTier(tierLevel: VIPTierLevel): Promise<{ success: boolean; tier: VIPTier }> {
    return this.fetchWithAuth(`/vip/tiers/${tierLevel}`);
  }

  async updateTier(tierLevel: VIPTierLevel, updates: UpdateVIPTierRequest): Promise<{ success: boolean; tier?: VIPTier; error?: string }> {
    return this.fetchWithAuth(`/vip/tiers/${tierLevel}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  // Members
  async getMembers(tierFilter?: VIPTierLevel, limit = 50, offset = 0): Promise<{
    success: boolean;
    members: VIPMember[];
    total: number;
    limit: number;
    offset: number;
  }> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });
    
    if (tierFilter) {
      params.append('tier_filter', tierFilter);
    }

    return this.fetchWithAuth(`/vip/members?${params}`);
  }

  async getMember(customerId: string): Promise<{ success: boolean; member: VIPMember }> {
    return this.fetchWithAuth(`/vip/members/${customerId}`);
  }

  async createMember(request: CreateVIPMemberRequest): Promise<{ success: boolean; member?: VIPMember; error?: string }> {
    return this.fetchWithAuth('/vip/members', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async updateMemberProgress(
    customerId: string,
    amountSpent: number = 0,
    pointsEarned: number = 0,
    orderPlaced: boolean = false
  ): Promise<{ success: boolean; member?: VIPMember; error?: string }> {
    const params = new URLSearchParams({
      amount_spent: amountSpent.toString(),
      points_earned: pointsEarned.toString(),
      order_placed: orderPlaced.toString(),
    });

    return this.fetchWithAuth(`/vip/members/${customerId}/progress?${params}`, {
      method: 'PUT',
    });
  }

  // Analytics
  async getAnalytics(): Promise<{ success: boolean; analytics?: VIPAnalytics; error?: string }> {
    return this.fetchWithAuth('/vip/analytics');
  }
}

export default new VIPApi(); 