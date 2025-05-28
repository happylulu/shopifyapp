/**
 * Compliance Webhook Handlers
 * Handles mandatory GDPR/privacy compliance webhooks
 */

import { BaseWebhookHandler, type WebhookContext, type WebhookProcessingResult } from '../base-handler';

/**
 * Customers/Redact Webhook Handler
 * Handles customer data deletion requests (GDPR Article 17 - Right to Erasure)
 */
export class CustomersRedactHandler extends BaseWebhookHandler {
  constructor() {
    super('customers/redact');
  }

  async processWebhook(context: WebhookContext): Promise<WebhookProcessingResult> {
    try {
      const { payload, shop } = context;
      
      const customerId = payload.customer?.id?.toString() || payload.customer_id?.toString();
      const customerEmail = payload.customer?.email || payload.email;
      
      if (!customerId) {
        return {
          success: false,
          message: 'No customer ID found in redaction request',
        };
      }

      // Redact customer data from loyalty system
      const redactionResult = await this.redactCustomerData(customerId, shop);

      return {
        success: true,
        message: `Customer data redacted successfully for customer ${customerId}`,
        data: {
          customerId,
          customerEmail,
          redactionResult,
        },
      };

    } catch (error) {
      console.error('Customer redaction webhook processing error:', error);
      return {
        success: false,
        message: 'Failed to process customer data redaction',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async redactCustomerData(customerId: string, shop: string) {
    try {
      // Call loyalty service to redact customer data
      const result = await this.callLoyaltyAPI('/api/compliance/redact-customer', 'POST', {
        customer_id: customerId,
        shop,
        redaction_type: 'full',
        requested_at: new Date().toISOString(),
        webhook_source: 'customers/redact',
      });

      return result;
    } catch (error) {
      console.error(`Failed to redact customer data for ${customerId}:`, error);
      throw error;
    }
  }
}

/**
 * Customers/Data_Request Webhook Handler
 * Handles customer data export requests (GDPR Article 15 - Right of Access)
 */
export class CustomersDataRequestHandler extends BaseWebhookHandler {
  constructor() {
    super('customers/data_request');
  }

  async processWebhook(context: WebhookContext): Promise<WebhookProcessingResult> {
    try {
      const { payload, shop } = context;
      
      const customerId = payload.customer?.id?.toString() || payload.customer_id?.toString();
      const customerEmail = payload.customer?.email || payload.email;
      
      if (!customerId) {
        return {
          success: false,
          message: 'No customer ID found in data request',
        };
      }

      // Generate customer data export
      const exportResult = await this.generateCustomerDataExport(customerId, shop);

      return {
        success: true,
        message: `Customer data export generated successfully for customer ${customerId}`,
        data: {
          customerId,
          customerEmail,
          exportResult,
        },
      };

    } catch (error) {
      console.error('Customer data request webhook processing error:', error);
      return {
        success: false,
        message: 'Failed to process customer data request',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async generateCustomerDataExport(customerId: string, shop: string) {
    try {
      // Call loyalty service to generate data export
      const result = await this.callLoyaltyAPI('/api/compliance/export-customer-data', 'POST', {
        customer_id: customerId,
        shop,
        export_format: 'json',
        requested_at: new Date().toISOString(),
        webhook_source: 'customers/data_request',
      });

      return result;
    } catch (error) {
      console.error(`Failed to generate data export for ${customerId}:`, error);
      throw error;
    }
  }
}

/**
 * Shop/Redact Webhook Handler
 * Handles shop data deletion when app is uninstalled (GDPR compliance)
 */
export class ShopRedactHandler extends BaseWebhookHandler {
  constructor() {
    super('shop/redact');
  }

  async processWebhook(context: WebhookContext): Promise<WebhookProcessingResult> {
    try {
      const { payload, shop } = context;
      
      const shopId = payload.shop_id?.toString() || payload.id?.toString();
      const shopDomain = payload.shop_domain || shop;
      
      if (!shopDomain) {
        return {
          success: false,
          message: 'No shop domain found in redaction request',
        };
      }

      // Redact all shop data from loyalty system
      const redactionResult = await this.redactShopData(shopDomain, shopId);

      return {
        success: true,
        message: `Shop data redacted successfully for shop ${shopDomain}`,
        data: {
          shopId,
          shopDomain,
          redactionResult,
        },
      };

    } catch (error) {
      console.error('Shop redaction webhook processing error:', error);
      return {
        success: false,
        message: 'Failed to process shop data redaction',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async redactShopData(shopDomain: string, shopId?: string) {
    try {
      // Call loyalty service to redact all shop data
      const result = await this.callLoyaltyAPI('/api/compliance/redact-shop', 'POST', {
        shop_domain: shopDomain,
        shop_id: shopId,
        redaction_type: 'full',
        requested_at: new Date().toISOString(),
        webhook_source: 'shop/redact',
      });

      return result;
    } catch (error) {
      console.error(`Failed to redact shop data for ${shopDomain}:`, error);
      throw error;
    }
  }
}

/**
 * App/Uninstalled Webhook Handler
 * Handles app uninstallation cleanup
 */
export class AppUninstalledHandler extends BaseWebhookHandler {
  constructor() {
    super('app/uninstalled');
  }

  async processWebhook(context: WebhookContext): Promise<WebhookProcessingResult> {
    try {
      const { payload, shop } = context;
      
      const shopId = payload.id?.toString();
      const shopDomain = payload.domain || shop;
      
      if (!shopDomain) {
        return {
          success: false,
          message: 'No shop domain found in uninstall request',
        };
      }

      // Perform cleanup operations
      const cleanupResult = await this.performAppUninstallCleanup(shopDomain, shopId);

      return {
        success: true,
        message: `App uninstall cleanup completed for shop ${shopDomain}`,
        data: {
          shopId,
          shopDomain,
          cleanupResult,
        },
      };

    } catch (error) {
      console.error('App uninstall webhook processing error:', error);
      return {
        success: false,
        message: 'Failed to process app uninstall cleanup',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async performAppUninstallCleanup(shopDomain: string, shopId?: string) {
    try {
      // Call loyalty service to perform cleanup
      const result = await this.callLoyaltyAPI('/api/app/uninstall', 'POST', {
        shop_domain: shopDomain,
        shop_id: shopId,
        uninstalled_at: new Date().toISOString(),
        cleanup_type: 'soft_delete', // Keep data for potential reinstall
        webhook_source: 'app/uninstalled',
      });

      return result;
    } catch (error) {
      console.error(`Failed to perform uninstall cleanup for ${shopDomain}:`, error);
      throw error;
    }
  }
}

/**
 * Customers/Create Webhook Handler (Optional)
 * Creates initial loyalty profile for new customers
 */
export class CustomersCreateHandler extends BaseWebhookHandler {
  constructor() {
    super('customers/create');
  }

  async processWebhook(context: WebhookContext): Promise<WebhookProcessingResult> {
    try {
      const { payload, shop } = context;
      
      const customerInfo = this.extractCustomerInfo(payload);
      
      if (!customerInfo.customerId) {
        return {
          success: false,
          message: 'No customer ID found in customer creation request',
        };
      }

      // Create initial loyalty profile
      const profileResult = await this.createInitialLoyaltyProfile(customerInfo, shop);

      return {
        success: true,
        message: `Initial loyalty profile created for customer ${customerInfo.customerId}`,
        data: {
          customerId: customerInfo.customerId,
          customerEmail: customerInfo.email,
          profileResult,
        },
      };

    } catch (error) {
      console.error('Customer creation webhook processing error:', error);
      return {
        success: false,
        message: 'Failed to create initial loyalty profile',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async createInitialLoyaltyProfile(
    customerInfo: {
      customerId?: string;
      email?: string;
      firstName?: string;
      lastName?: string;
    },
    shop: string
  ) {
    try {
      // Call loyalty service to create initial profile
      const result = await this.callLoyaltyAPI('/api/customers/create-profile', 'POST', {
        customer_id: customerInfo.customerId,
        email: customerInfo.email,
        first_name: customerInfo.firstName,
        last_name: customerInfo.lastName,
        shop,
        initial_points: 0, // Could be a welcome bonus
        created_via: 'webhook',
        webhook_source: 'customers/create',
      });

      return result;
    } catch (error) {
      console.error(`Failed to create loyalty profile for ${customerInfo.customerId}:`, error);
      throw error;
    }
  }
}
