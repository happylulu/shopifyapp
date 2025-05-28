/**
 * Generated GraphQL Types
 * DO NOT EDIT - This file is auto-generated
 */

export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };

/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  DateTime: string;
  Decimal: string;
};

// Customer Types
export type Customer = {
  __typename?: 'Customer';
  id: Scalars['String'];
  email: Scalars['String'];
  first_name?: Maybe<Scalars['String']>;
  last_name?: Maybe<Scalars['String']>;
  phone?: Maybe<Scalars['String']>;
  tags: Array<Scalars['String']>;
  created_at: Scalars['DateTime'];
  updated_at?: Maybe<Scalars['DateTime']>;
  loyalty_profile?: Maybe<LoyaltyProfile>;
};

// Loyalty Profile Types
export type LoyaltyProfile = {
  __typename?: 'LoyaltyProfile';
  id: Scalars['String'];
  customer_id: Scalars['String'];
  points_balance: Scalars['Int'];
  lifetime_points: Scalars['Int'];
  current_tier?: Maybe<Tier>;
  next_tier?: Maybe<Tier>;
  points_to_next_tier?: Maybe<Scalars['Int']>;
  tier_progress_percentage: Scalars['Float'];
  member_since: Scalars['DateTime'];
  last_activity?: Maybe<Scalars['DateTime']>;
};

// Tier Types
export type Tier = {
  __typename?: 'Tier';
  id: Scalars['String'];
  name: Scalars['String'];
  level: Scalars['Int'];
  min_points_required: Scalars['Int'];
  description?: Maybe<Scalars['String']>;
  benefits: Array<Scalars['String']>;
  icon_url?: Maybe<Scalars['String']>;
  color?: Maybe<Scalars['String']>;
};

// Reward Types
export type Reward = {
  __typename?: 'Reward';
  id: Scalars['String'];
  name: Scalars['String'];
  description?: Maybe<Scalars['String']>;
  points_cost: Scalars['Int'];
  reward_type: Scalars['String'];
  value?: Maybe<Scalars['Decimal']>;
  image_url?: Maybe<Scalars['String']>;
  category?: Maybe<Scalars['String']>;
  available: Scalars['Boolean'];
  terms_and_conditions?: Maybe<Scalars['String']>;
  expires_at?: Maybe<Scalars['DateTime']>;
};

// Transaction Types
export type PointsTransaction = {
  __typename?: 'PointsTransaction';
  id: Scalars['String'];
  amount: Scalars['Int'];
  transaction_type: Scalars['String'];
  reason: Scalars['String'];
  reference_id?: Maybe<Scalars['String']>;
  created_at: Scalars['DateTime'];
  expires_at?: Maybe<Scalars['DateTime']>;
};

// Earning Opportunities
export type PointsEarningOpportunity = {
  __typename?: 'PointsEarningOpportunity';
  action: Scalars['String'];
  points: Scalars['Int'];
  description: Scalars['String'];
  url?: Maybe<Scalars['String']>;
  available: Scalars['Boolean'];
};

// Input Types
export type RedeemRewardInput = {
  reward_id: Scalars['String'];
  customer_id: Scalars['String'];
  quantity?: InputMaybe<Scalars['Int']>;
};

export type TrackActionInput = {
  customer_id: Scalars['String'];
  action_type: Scalars['String'];
  metadata?: InputMaybe<Scalars['String']>;
};

export type CreateReferralLinkInput = {
  customer_id: Scalars['String'];
  campaign?: InputMaybe<Scalars['String']>;
};

// Result Types
export type RedemptionResult = {
  __typename?: 'RedemptionResult';
  success: Scalars['Boolean'];
  message: Scalars['String'];
  redemption_id?: Maybe<Scalars['String']>;
  discount_code?: Maybe<Scalars['String']>;
  points_deducted?: Maybe<Scalars['Int']>;
  new_balance?: Maybe<Scalars['Int']>;
};

export type ReferralLink = {
  __typename?: 'ReferralLink';
  id: Scalars['String'];
  code: Scalars['String'];
  url: Scalars['String'];
  clicks: Scalars['Int'];
  conversions: Scalars['Int'];
  points_earned: Scalars['Int'];
  created_at: Scalars['DateTime'];
  expires_at?: Maybe<Scalars['DateTime']>;
};

// Query Types
export type Query = {
  __typename?: 'Query';
  loyaltyProfile?: Maybe<LoyaltyProfile>;
  availableRewards: Array<Reward>;
  pointsHistory: Array<PointsTransaction>;
  earningOpportunities: Array<PointsEarningOpportunity>;
};

// Mutation Types
export type Mutation = {
  __typename?: 'Mutation';
  redeemReward: RedemptionResult;
  trackAction: Scalars['Boolean'];
  createReferralLink: ReferralLink;
};

// Query Variables
export type GetCustomerLoyaltyProfileQueryVariables = Exact<{
  customerId: Scalars['String'];
}>;

export type GetCustomerLoyaltyProfileQuery = {
  __typename?: 'Query';
  loyaltyProfile?: {
    __typename?: 'LoyaltyProfile';
    id: string;
    customer_id: string;
    points_balance: number;
    lifetime_points: number;
    current_tier?: {
      __typename?: 'Tier';
      id: string;
      name: string;
      level: number;
      min_points_required: number;
      description?: string | null;
      benefits: Array<string>;
      icon_url?: string | null;
      color?: string | null;
    } | null;
    next_tier?: {
      __typename?: 'Tier';
      id: string;
      name: string;
      level: number;
      min_points_required: number;
      description?: string | null;
    } | null;
    points_to_next_tier?: number | null;
    tier_progress_percentage: number;
    member_since: string;
    last_activity?: string | null;
  } | null;
};

export type GetAvailableRewardsQueryVariables = Exact<{
  customerId?: InputMaybe<Scalars['String']>;
  maxPoints?: InputMaybe<Scalars['Int']>;
  category?: InputMaybe<Scalars['String']>;
}>;

export type GetAvailableRewardsQuery = {
  __typename?: 'Query';
  availableRewards: Array<{
    __typename?: 'Reward';
    id: string;
    name: string;
    description?: string | null;
    points_cost: number;
    reward_type: string;
    value?: string | null;
    image_url?: string | null;
    category?: string | null;
    available: boolean;
    terms_and_conditions?: string | null;
    expires_at?: string | null;
  }>;
};

export type GetPointsHistoryQueryVariables = Exact<{
  customerId: Scalars['String'];
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
}>;

export type GetPointsHistoryQuery = {
  __typename?: 'Query';
  pointsHistory: Array<{
    __typename?: 'PointsTransaction';
    id: string;
    amount: number;
    transaction_type: string;
    reason: string;
    reference_id?: string | null;
    created_at: string;
    expires_at?: string | null;
  }>;
};

export type RedeemRewardMutationVariables = Exact<{
  input: RedeemRewardInput;
}>;

export type RedeemRewardMutation = {
  __typename?: 'Mutation';
  redeemReward: {
    __typename?: 'RedemptionResult';
    success: boolean;
    message: string;
    redemption_id?: string | null;
    discount_code?: string | null;
    points_deducted?: number | null;
    new_balance?: number | null;
  };
};

export type TrackCustomerActionMutationVariables = Exact<{
  input: TrackActionInput;
}>;

export type TrackCustomerActionMutation = {
  __typename?: 'Mutation';
  trackAction: boolean;
};

// GraphQL Documents
export const GetCustomerLoyaltyProfileDocument = `
  query GetCustomerLoyaltyProfile($customerId: String!) {
    loyaltyProfile(customerId: $customerId) {
      id
      customer_id
      points_balance
      lifetime_points
      current_tier {
        id
        name
        level
        min_points_required
        description
        benefits
        icon_url
        color
      }
      next_tier {
        id
        name
        level
        min_points_required
        description
      }
      points_to_next_tier
      tier_progress_percentage
      member_since
      last_activity
    }
  }
`;

export const GetAvailableRewardsDocument = `
  query GetAvailableRewards($customerId: String, $maxPoints: Int, $category: String) {
    availableRewards(customerId: $customerId, maxPoints: $maxPoints, category: $category) {
      id
      name
      description
      points_cost
      reward_type
      value
      image_url
      category
      available
      terms_and_conditions
      expires_at
    }
  }
`;

export const GetPointsHistoryDocument = `
  query GetPointsHistory($customerId: String!, $limit: Int, $offset: Int) {
    pointsHistory(customerId: $customerId, limit: $limit, offset: $offset) {
      id
      amount
      transaction_type
      reason
      reference_id
      created_at
      expires_at
    }
  }
`;

export const RedeemRewardDocument = `
  mutation RedeemReward($input: RedeemRewardInput!) {
    redeemReward(input: $input) {
      success
      message
      redemption_id
      discount_code
      points_deducted
      new_balance
    }
  }
`;

export const TrackCustomerActionDocument = `
  mutation TrackCustomerAction($input: TrackActionInput!) {
    trackAction(input: $input)
  }
`;

// GraphQL Client SDK
export interface Sdk {
  GetCustomerLoyaltyProfile(variables: GetCustomerLoyaltyProfileQueryVariables): Promise<GetCustomerLoyaltyProfileQuery>;
  GetAvailableRewards(variables?: GetAvailableRewardsQueryVariables): Promise<GetAvailableRewardsQuery>;
  GetPointsHistory(variables: GetPointsHistoryQueryVariables): Promise<GetPointsHistoryQuery>;
  RedeemReward(variables: RedeemRewardMutationVariables): Promise<RedeemRewardMutation>;
  TrackCustomerAction(variables: TrackCustomerActionMutationVariables): Promise<TrackCustomerActionMutation>;
}

export function getSdk(client: any): Sdk {
  return {
    GetCustomerLoyaltyProfile: (variables: GetCustomerLoyaltyProfileQueryVariables) =>
      client.request(GetCustomerLoyaltyProfileDocument, variables),
    GetAvailableRewards: (variables?: GetAvailableRewardsQueryVariables) =>
      client.request(GetAvailableRewardsDocument, variables),
    GetPointsHistory: (variables: GetPointsHistoryQueryVariables) =>
      client.request(GetPointsHistoryDocument, variables),
    RedeemReward: (variables: RedeemRewardMutationVariables) =>
      client.request(RedeemRewardDocument, variables),
    TrackCustomerAction: (variables: TrackCustomerActionMutationVariables) =>
      client.request(TrackCustomerActionDocument, variables),
  };
}
