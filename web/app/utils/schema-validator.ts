/**
 * Schema Validator Utility
 * 
 * Validates API responses against the loyalty schema to ensure
 * contract compliance between frontend and backend.
 */

import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import loyaltySchema from '../schemas/loyalty.schema.json';

// Initialize AJV with format support
const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

// Compile schema validators
const validators = {
  customerProfile: ajv.compile(loyaltySchema.definitions.CustomerProfile),
  reward: ajv.compile(loyaltySchema.definitions.Reward),
  tier: ajv.compile(loyaltySchema.definitions.Tier),
  adjustPointsRequest: ajv.compile(loyaltySchema.definitions.AdjustPointsRequest),
  createRewardRequest: ajv.compile(loyaltySchema.definitions.CreateRewardRequest),
  createTierRequest: ajv.compile(loyaltySchema.definitions.CreateTierRequest),
  errorResponse: ajv.compile(loyaltySchema.definitions.ErrorResponse),
};

export interface ValidationResult {
  valid: boolean;
  errors?: string[];
}

/**
 * Validate a customer profile response
 */
export function validateCustomerProfile(data: any): ValidationResult {
  const valid = validators.customerProfile(data);
  return {
    valid,
    errors: valid ? undefined : validators.customerProfile.errors?.map(err => 
      `${err.instancePath} ${err.message}`
    )
  };
}

/**
 * Validate a reward response
 */
export function validateReward(data: any): ValidationResult {
  const valid = validators.reward(data);
  return {
    valid,
    errors: valid ? undefined : validators.reward.errors?.map(err => 
      `${err.instancePath} ${err.message}`
    )
  };
}

/**
 * Validate an array of rewards
 */
export function validateRewards(data: any[]): ValidationResult {
  if (!Array.isArray(data)) {
    return { valid: false, errors: ['Expected an array of rewards'] };
  }

  const errors: string[] = [];
  
  data.forEach((reward, index) => {
    const result = validateReward(reward);
    if (!result.valid && result.errors) {
      errors.push(...result.errors.map(err => `Reward ${index}: ${err}`));
    }
  });

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  };
}

/**
 * Validate a tier response
 */
export function validateTier(data: any): ValidationResult {
  const valid = validators.tier(data);
  return {
    valid,
    errors: valid ? undefined : validators.tier.errors?.map(err => 
      `${err.instancePath} ${err.message}`
    )
  };
}

/**
 * Validate an array of tiers
 */
export function validateTiers(data: any[]): ValidationResult {
  if (!Array.isArray(data)) {
    return { valid: false, errors: ['Expected an array of tiers'] };
  }

  const errors: string[] = [];
  
  data.forEach((tier, index) => {
    const result = validateTier(tier);
    if (!result.valid && result.errors) {
      errors.push(...result.errors.map(err => `Tier ${index}: ${err}`));
    }
  });

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  };
}

/**
 * Validate an adjust points request
 */
export function validateAdjustPointsRequest(data: any): ValidationResult {
  const valid = validators.adjustPointsRequest(data);
  return {
    valid,
    errors: valid ? undefined : validators.adjustPointsRequest.errors?.map(err => 
      `${err.instancePath} ${err.message}`
    )
  };
}

/**
 * Validate a create reward request
 */
export function validateCreateRewardRequest(data: any): ValidationResult {
  const valid = validators.createRewardRequest(data);
  return {
    valid,
    errors: valid ? undefined : validators.createRewardRequest.errors?.map(err => 
      `${err.instancePath} ${err.message}`
    )
  };
}

/**
 * Validate a create tier request
 */
export function validateCreateTierRequest(data: any): ValidationResult {
  const valid = validators.createTierRequest(data);
  return {
    valid,
    errors: valid ? undefined : validators.createTierRequest.errors?.map(err => 
      `${err.instancePath} ${err.message}`
    )
  };
}

/**
 * Generic API response validator with logging
 */
export function validateApiResponse<T>(
  data: any,
  validator: (data: any) => ValidationResult,
  endpoint: string
): T | null {
  const result = validator(data);
  
  if (!result.valid) {
    console.error(`Schema validation failed for ${endpoint}:`, {
      data,
      errors: result.errors
    });
    
    // In development, throw an error to catch contract violations early
    if (process.env.NODE_ENV === 'development') {
      throw new Error(
        `API contract violation at ${endpoint}: ${result.errors?.join(', ')}`
      );
    }
    
    return null;
  }
  
  return data as T;
}

/**
 * Middleware for API calls that validates responses
 */
export async function fetchWithValidation<T>(
  url: string,
  validator: (data: any) => ValidationResult,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(url, options);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || errorData.message || `HTTP ${response.status}`
    );
  }
  
  const data = await response.json();
  const validatedData = validateApiResponse<T>(data, validator, url);
  
  if (validatedData === null) {
    throw new Error(`Invalid response format from ${url}`);
  }
  
  return validatedData;
}

/**
 * Type-safe API client with validation
 */
export const loyaltyApi = {
  async getCustomerProfile(customerId: string) {
    return fetchWithValidation(
      `/api/loyalty/profiles/${customerId}/`,
      validateCustomerProfile
    );
  },

  async adjustPoints(customerId: string, request: any) {
    const validation = validateAdjustPointsRequest(request);
    if (!validation.valid) {
      throw new Error(`Invalid request: ${validation.errors?.join(', ')}`);
    }

    return fetchWithValidation(
      `/api/loyalty/profiles/${customerId}/points/`,
      validateCustomerProfile,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      }
    );
  },

  async getRewards() {
    return fetchWithValidation(
      '/api/rewards/',
      validateRewards
    );
  },

  async createReward(request: any) {
    const validation = validateCreateRewardRequest(request);
    if (!validation.valid) {
      throw new Error(`Invalid request: ${validation.errors?.join(', ')}`);
    }

    return fetchWithValidation(
      '/api/rewards/',
      validateReward,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      }
    );
  },

  async getTiers() {
    return fetchWithValidation(
      '/api/tiers/',
      validateTiers
    );
  },

  async createTier(request: any) {
    const validation = validateCreateTierRequest(request);
    if (!validation.valid) {
      throw new Error(`Invalid request: ${validation.errors?.join(', ')}`);
    }

    return fetchWithValidation(
      '/api/tiers/',
      validateTier,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      }
    );
  }
};
