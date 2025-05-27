import type { 
  AIInsightsResponse, 
  AIPerformanceMetrics, 
  ExecuteActionRequest,
  CreateSegmentRequest,
  AIOpportunity,
  SegmentAnalytics
} from '../types/ai-insights';

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-api-domain.com' 
  : 'http://localhost:8000';

class AIApiService {
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    const requestOptions = { ...defaultOptions, ...options };

    try {
      const response = await fetch(url, requestOptions);
      
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`API Error: ${response.status} - ${errorData}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // ============= AI INSIGHTS ENDPOINTS =============

  async getAIInsights(days: number = 30): Promise<AIInsightsResponse> {
    return this.request<AIInsightsResponse>(`/ai/insights?days=${days}`);
  }

  async refreshInsights(): Promise<{ 
    success: boolean; 
    message: string;
    processing_time: string;
    new_opportunities_found: number;
    updated_segments: number;
    next_auto_refresh: string;
  }> {
    return this.request('/ai/insights/refresh', {
      method: 'POST',
    });
  }

  async executeAction(request: ExecuteActionRequest): Promise<{
    success: boolean;
    action_executed: string;
    customers_affected: number;
    estimated_impact: string;
    execution_time: string;
    follow_up_date: string;
    success_probability: string;
  }> {
    return this.request('/ai/actions/execute', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getPerformanceMetrics(): Promise<AIPerformanceMetrics> {
    return this.request<AIPerformanceMetrics>('/ai/performance');
  }

  async createCustomSegment(request: CreateSegmentRequest): Promise<{
    success: boolean;
    segment_id: string;
    name: string;
    description: string;
    criteria: Record<string, any>;
    auto_update: boolean;
    created_at: string;
    estimated_customers: number;
  }> {
    return this.request('/ai/segments/create', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getCustomerSegments(): Promise<{
    success: boolean;
    segments: SegmentAnalytics[];
    total_customers: number;
    last_updated: string;
  }> {
    return this.request('/ai/segments');
  }

  async getOpportunities(
    typeFilter?: string,
    impactThreshold: number = 0,
    limit: number = 10
  ): Promise<{
    success: boolean;
    opportunities: AIOpportunity[];
    total_count: number;
    filters_applied: {
      type: string | null;
      impact_threshold: number;
    };
  }> {
    const params = new URLSearchParams();
    if (typeFilter) params.append('type_filter', typeFilter);
    if (impactThreshold > 0) params.append('impact_threshold', impactThreshold.toString());
    params.append('limit', limit.toString());

    return this.request(`/ai/opportunities?${params.toString()}`);
  }

  // ============= UTILITY METHODS =============

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  formatPercentage(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(value / 100);
  }

  formatDate(dateString: string): string {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString));
  }

  getInsightTypeColor(type: string): string {
    const colors = {
      opportunity: '#22c55e',
      warning: '#ef4444',
      optimization: '#3b82f6',
      trend: '#8b5cf6'
    };
    return colors[type as keyof typeof colors] || '#6b7280';
  }

  getEffortLevelBadge(effort: string): { tone: string; text: string } {
    const badges = {
      low: { tone: 'success', text: 'Low Effort' },
      medium: { tone: 'warning', text: 'Medium Effort' },
      high: { tone: 'critical', text: 'High Effort' }
    };
    return badges[effort as keyof typeof badges] || { tone: 'info', text: 'Unknown' };
  }

  calculateTimeToExpire(expiresAt?: string): string {
    if (!expiresAt) return 'No expiration';
    
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffMs = expiry.getTime() - now.getTime();
    
    if (diffMs <= 0) return 'Expired';
    
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days} day${days !== 1 ? 's' : ''} left`;
    return `${hours} hour${hours !== 1 ? 's' : ''} left`;
  }
}

const aiApi = new AIApiService();
export default aiApi; 