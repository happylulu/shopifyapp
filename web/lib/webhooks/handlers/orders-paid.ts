/**
 * Orders/Paid Webhook Handler
 * Processes paid orders to award loyalty points
 */

import { BaseWebhookHandler, type WebhookContext, type WebhookProcessingResult } from '../base-handler';

export class OrdersPaidHandler extends BaseWebhookHandler {
  constructor() {
    super('orders/paid');
  }

  async processWebhook(context: WebhookContext): Promise<WebhookProcessingResult> {
    try {
      const { payload, shop } = context;
      
      // Extract order information
      const orderInfo = this.extractOrderInfo(payload);
      const customerInfo = this.extractCustomerInfo(payload);

      // Validate required fields
      const validation = this.validateRequiredFields(orderInfo, ['orderId', 'totalPrice']);
      if (!validation.isValid) {
        return {
          success: false,
          message: `Missing required order fields: ${validation.missingFields.join(', ')}`,
        };
      }

      // Skip if no customer (guest checkout)
      if (!customerInfo.customerId) {
        return {
          success: true,
          message: 'Order processed but no customer ID found (guest checkout)',
        };
      }

      // Calculate points to award
      const pointsCalculation = this.calculatePointsForOrder(orderInfo);
      
      if (pointsCalculation.points <= 0) {
        return {
          success: true,
          message: 'Order processed but no points awarded (below minimum threshold)',
        };
      }

      // Award points through loyalty service
      const loyaltyResult = await this.awardPointsForOrder({
        customerId: customerInfo.customerId,
        orderId: orderInfo.orderId!,
        orderNumber: orderInfo.orderNumber,
        points: pointsCalculation.points,
        reason: pointsCalculation.reason,
        totalPrice: orderInfo.totalPrice!,
        currency: orderInfo.currency || 'USD',
        shop,
        lineItems: orderInfo.lineItems || [],
      });

      return {
        success: true,
        message: `Successfully awarded ${pointsCalculation.points} points for order ${orderInfo.orderNumber}`,
        data: {
          customerId: customerInfo.customerId,
          orderId: orderInfo.orderId,
          pointsAwarded: pointsCalculation.points,
          loyaltyResult,
        },
      };

    } catch (error) {
      console.error('Orders/paid webhook processing error:', error);
      return {
        success: false,
        message: 'Failed to process order for points',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Calculate points to award for an order
   */
  private calculatePointsForOrder(orderInfo: {
    totalPrice?: number;
    currency?: string;
    lineItems?: any[];
  }): { points: number; reason: string } {
    const totalPrice = orderInfo.totalPrice || 0;
    
    // Basic points calculation: 1 point per dollar spent
    // Minimum order value of $1 to earn points
    if (totalPrice < 1) {
      return { points: 0, reason: 'Order below minimum threshold' };
    }

    // Calculate base points (1 point per dollar, rounded down)
    let points = Math.floor(totalPrice);
    let reason = `Order purchase: $${totalPrice.toFixed(2)}`;

    // Bonus points for large orders
    if (totalPrice >= 100) {
      const bonusPoints = Math.floor(totalPrice * 0.1); // 10% bonus
      points += bonusPoints;
      reason += ` (includes ${bonusPoints} bonus points for large order)`;
    }

    // Category-based bonus points
    const categoryBonus = this.calculateCategoryBonus(orderInfo.lineItems || []);
    if (categoryBonus.points > 0) {
      points += categoryBonus.points;
      reason += ` (includes ${categoryBonus.points} category bonus points)`;
    }

    return { points, reason };
  }

  /**
   * Calculate bonus points based on product categories
   */
  private calculateCategoryBonus(lineItems: any[]): { points: number; reason: string } {
    let bonusPoints = 0;
    const bonusCategories: Record<string, number> = {
      'electronics': 2, // 2x points for electronics
      'books': 1.5,     // 1.5x points for books
      'clothing': 1.2,  // 1.2x points for clothing
    };

    for (const item of lineItems) {
      const productType = item.product?.product_type?.toLowerCase();
      const quantity = parseInt(item.quantity || '1');
      const price = parseFloat(item.price || '0');
      
      if (productType && bonusCategories[productType]) {
        const multiplier = bonusCategories[productType] - 1; // Subtract base rate
        bonusPoints += Math.floor(price * quantity * multiplier);
      }
    }

    return {
      points: bonusPoints,
      reason: bonusPoints > 0 ? 'Category bonus applied' : 'No category bonus',
    };
  }

  /**
   * Award points through loyalty service
   */
  private async awardPointsForOrder(data: {
    customerId: string;
    orderId: string;
    orderNumber?: string;
    points: number;
    reason: string;
    totalPrice: number;
    currency: string;
    shop: string;
    lineItems: any[];
  }) {
    try {
      // Call loyalty service to award points
      const result = await this.callLoyaltyAPI('/api/points/award', 'POST', {
        customer_id: data.customerId,
        points: data.points,
        transaction_type: 'earned',
        reason: data.reason,
        reference_id: data.orderId,
        metadata: {
          order_number: data.orderNumber,
          total_price: data.totalPrice,
          currency: data.currency,
          shop: data.shop,
          line_items_count: data.lineItems.length,
          webhook_source: 'orders/paid',
        },
      });

      // Also trigger tier evaluation
      await this.callLoyaltyAPI('/api/tiers/evaluate', 'POST', {
        customer_id: data.customerId,
        trigger: 'order_completed',
        metadata: {
          order_id: data.orderId,
          points_awarded: data.points,
        },
      });

      return result;

    } catch (error) {
      console.error('Failed to award points through loyalty service:', error);
      throw error;
    }
  }

  /**
   * Handle order modifications (for future use)
   */
  private async handleOrderModification(
    originalOrderId: string,
    newOrderData: any
  ): Promise<void> {
    // This would handle cases where orders are modified after payment
    // For now, we'll just log it
    console.log(`Order modification detected for order ${originalOrderId}`, newOrderData);
  }

  /**
   * Validate order eligibility for points
   */
  private isOrderEligibleForPoints(orderInfo: {
    totalPrice?: number;
    currency?: string;
  }): { eligible: boolean; reason: string } {
    // Check minimum order value
    if (!orderInfo.totalPrice || orderInfo.totalPrice < 1) {
      return {
        eligible: false,
        reason: 'Order value below minimum threshold ($1)',
      };
    }

    // Check supported currencies
    const supportedCurrencies = ['USD', 'CAD', 'EUR', 'GBP'];
    if (orderInfo.currency && !supportedCurrencies.includes(orderInfo.currency)) {
      return {
        eligible: false,
        reason: `Currency ${orderInfo.currency} not supported for points`,
      };
    }

    return {
      eligible: true,
      reason: 'Order eligible for points',
    };
  }
}
