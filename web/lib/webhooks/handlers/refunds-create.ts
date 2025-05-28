/**
 * Refunds/Create Webhook Handler
 * Processes refunds to deduct loyalty points
 */

import { BaseWebhookHandler, type WebhookContext, type WebhookProcessingResult } from '../base-handler';

export class RefundsCreateHandler extends BaseWebhookHandler {
  constructor() {
    super('refunds/create');
  }

  async processWebhook(context: WebhookContext): Promise<WebhookProcessingResult> {
    try {
      const { payload, shop } = context;
      
      // Extract refund information
      const refundInfo = this.extractRefundInfo(payload);
      
      // Validate required fields
      const validation = this.validateRequiredFields(refundInfo, ['refundId', 'orderId']);
      if (!validation.isValid) {
        return {
          success: false,
          message: `Missing required refund fields: ${validation.missingFields.join(', ')}`,
        };
      }

      // Get original order information
      const orderInfo = await this.getOriginalOrderInfo(refundInfo.orderId!, shop);
      
      if (!orderInfo || !orderInfo.customerId) {
        return {
          success: true,
          message: 'Refund processed but no customer found for points deduction',
        };
      }

      // Calculate points to deduct
      const pointsCalculation = this.calculatePointsToDeduct(refundInfo, orderInfo);
      
      if (pointsCalculation.points <= 0) {
        return {
          success: true,
          message: 'Refund processed but no points deducted (no eligible items)',
        };
      }

      // Deduct points through loyalty service
      const loyaltyResult = await this.deductPointsForRefund({
        customerId: orderInfo.customerId,
        orderId: refundInfo.orderId!,
        refundId: refundInfo.refundId!,
        points: pointsCalculation.points,
        reason: pointsCalculation.reason,
        refundAmount: refundInfo.totalRefundAmount || 0,
        shop,
        refundLineItems: refundInfo.refundLineItems || [],
      });

      return {
        success: true,
        message: `Successfully deducted ${pointsCalculation.points} points for refund ${refundInfo.refundId}`,
        data: {
          customerId: orderInfo.customerId,
          orderId: refundInfo.orderId,
          refundId: refundInfo.refundId,
          pointsDeducted: pointsCalculation.points,
          loyaltyResult,
        },
      };

    } catch (error) {
      console.error('Refunds/create webhook processing error:', error);
      return {
        success: false,
        message: 'Failed to process refund for points deduction',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Extract refund information from payload
   */
  private extractRefundInfo(payload: any): {
    refundId?: string;
    orderId?: string;
    totalRefundAmount?: number;
    currency?: string;
    refundLineItems?: any[];
    createdAt?: string;
  } {
    return {
      refundId: payload.id?.toString(),
      orderId: payload.order_id?.toString(),
      totalRefundAmount: parseFloat(payload.total_refunded_amount || '0'),
      currency: payload.currency,
      refundLineItems: payload.refund_line_items || [],
      createdAt: payload.created_at,
    };
  }

  /**
   * Get original order information from loyalty service
   */
  private async getOriginalOrderInfo(orderId: string, shop: string): Promise<{
    customerId?: string;
    originalPoints?: number;
    orderTotal?: number;
  } | null> {
    try {
      // First try to get from loyalty service
      const loyaltyOrder = await this.callLoyaltyAPI(
        `/api/orders/${orderId}`,
        'GET'
      );

      if (loyaltyOrder) {
        return {
          customerId: loyaltyOrder.customer_id,
          originalPoints: loyaltyOrder.points_awarded,
          orderTotal: loyaltyOrder.total_price,
        };
      }

      // Fallback: try to get from Shopify API (would need admin API access)
      // For now, return null - in production you'd implement Shopify API call
      return null;

    } catch (error) {
      console.error(`Failed to get original order info for ${orderId}:`, error);
      return null;
    }
  }

  /**
   * Calculate points to deduct for a refund
   */
  private calculatePointsToDeduct(
    refundInfo: {
      totalRefundAmount?: number;
      refundLineItems?: any[];
    },
    orderInfo: {
      originalPoints?: number;
      orderTotal?: number;
    }
  ): { points: number; reason: string } {
    const refundAmount = refundInfo.totalRefundAmount || 0;
    const orderTotal = orderInfo.orderTotal || 0;
    const originalPoints = orderInfo.originalPoints || 0;

    if (refundAmount <= 0 || orderTotal <= 0) {
      return { points: 0, reason: 'Invalid refund or order amount' };
    }

    // Calculate proportional points deduction
    const refundRatio = Math.min(refundAmount / orderTotal, 1); // Cap at 100%
    const pointsToDeduct = Math.floor(originalPoints * refundRatio);

    let reason = `Refund: $${refundAmount.toFixed(2)} (${(refundRatio * 100).toFixed(1)}% of order)`;

    // Handle full refunds
    if (refundRatio >= 0.99) { // 99% or more is considered full refund
      reason = `Full refund: $${refundAmount.toFixed(2)}`;
    }

    return { points: pointsToDeduct, reason };
  }

  /**
   * Deduct points through loyalty service
   */
  private async deductPointsForRefund(data: {
    customerId: string;
    orderId: string;
    refundId: string;
    points: number;
    reason: string;
    refundAmount: number;
    shop: string;
    refundLineItems: any[];
  }) {
    try {
      // Call loyalty service to deduct points
      const result = await this.callLoyaltyAPI('/api/points/deduct', 'POST', {
        customer_id: data.customerId,
        points: data.points,
        transaction_type: 'deducted',
        reason: data.reason,
        reference_id: data.refundId,
        metadata: {
          original_order_id: data.orderId,
          refund_amount: data.refundAmount,
          shop: data.shop,
          refund_items_count: data.refundLineItems.length,
          webhook_source: 'refunds/create',
        },
      });

      // Also trigger tier re-evaluation
      await this.callLoyaltyAPI('/api/tiers/evaluate', 'POST', {
        customer_id: data.customerId,
        trigger: 'refund_processed',
        metadata: {
          refund_id: data.refundId,
          points_deducted: data.points,
        },
      });

      return result;

    } catch (error) {
      console.error('Failed to deduct points through loyalty service:', error);
      throw error;
    }
  }

  /**
   * Handle partial refunds with specific line items
   */
  private calculateLineItemPointsDeduction(
    refundLineItems: any[],
    originalOrderPoints: number
  ): { points: number; reason: string } {
    // This would implement more sophisticated logic for partial refunds
    // based on specific line items being refunded
    
    let totalRefundValue = 0;
    let itemCount = 0;

    for (const item of refundLineItems) {
      const quantity = parseInt(item.quantity || '0');
      const price = parseFloat(item.line_item?.price || '0');
      totalRefundValue += quantity * price;
      itemCount += quantity;
    }

    // Simple proportional calculation for now
    // In production, you'd want more sophisticated logic
    const estimatedPoints = Math.floor(totalRefundValue); // 1 point per dollar
    
    return {
      points: Math.min(estimatedPoints, originalOrderPoints),
      reason: `Partial refund: ${itemCount} items, $${totalRefundValue.toFixed(2)}`,
    };
  }

  /**
   * Validate refund eligibility for points deduction
   */
  private isRefundEligibleForPointsDeduction(refundInfo: {
    totalRefundAmount?: number;
    createdAt?: string;
  }): { eligible: boolean; reason: string } {
    // Check minimum refund amount
    if (!refundInfo.totalRefundAmount || refundInfo.totalRefundAmount < 0.01) {
      return {
        eligible: false,
        reason: 'Refund amount too small for points deduction',
      };
    }

    // Check refund age (optional business rule)
    if (refundInfo.createdAt) {
      const refundDate = new Date(refundInfo.createdAt);
      const daysSinceRefund = (Date.now() - refundDate.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysSinceRefund > 365) { // 1 year limit
        return {
          eligible: false,
          reason: 'Refund too old for points deduction',
        };
      }
    }

    return {
      eligible: true,
      reason: 'Refund eligible for points deduction',
    };
  }
}
