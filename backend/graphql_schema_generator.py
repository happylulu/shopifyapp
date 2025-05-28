"""
GraphQL Schema Generator & Documentation
Generates TypeScript types and documentation from Strawberry schema
"""

import strawberry
from strawberry.printer import print_schema
from strawberry.codegen import CodegenFile, CodegenConfig
import json
from typing import Dict, Any
from pathlib import Path

# from graphql_api import schema  # Comment out for now since we need to build it step by step

def generate_schema_sdl() -> str:
    """Generate GraphQL Schema Definition Language (SDL)"""
    return print_schema(schema)

def generate_introspection_query() -> Dict[str, Any]:
    """Generate introspection query result"""
    from graphql import build_client_schema, get_introspection_query, graphql_sync

    introspection_query = get_introspection_query()
    result = graphql_sync(schema, introspection_query)

    if result.errors:
        raise Exception(f"Introspection failed: {result.errors}")

    return result.data

def generate_typescript_types(output_path: str = "../web/lib/generated/graphql.ts"):
    """Generate TypeScript types from GraphQL schema"""

    # Get schema SDL
    schema_sdl = generate_schema_sdl()

    # Generate TypeScript types (this would use a tool like graphql-codegen)
    typescript_content = f'''
/**
 * Generated GraphQL Types
 * DO NOT EDIT - This file is auto-generated
 */

export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends {{ [key: string]: unknown }}> = {{ [K in keyof T]: T[K] }};
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & {{ [SubKey in K]?: Maybe<T[SubKey]> }};
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & {{ [SubKey in K]: Maybe<T[SubKey]> }};

/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {{
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  DateTime: string;
  Decimal: string;
}};

// Customer Types
export type Customer = {{
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
}};

// Loyalty Profile Types
export type LoyaltyProfile = {{
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
}};

// Tier Types
export type Tier = {{
  __typename?: 'Tier';
  id: Scalars['String'];
  name: Scalars['String'];
  level: Scalars['Int'];
  min_points_required: Scalars['Int'];
  description?: Maybe<Scalars['String']>;
  benefits: Array<Scalars['String']>;
  icon_url?: Maybe<Scalars['String']>;
  color?: Maybe<Scalars['String']>;
}};

// Reward Types
export type Reward = {{
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
}};

// Transaction Types
export type PointsTransaction = {{
  __typename?: 'PointsTransaction';
  id: Scalars['String'];
  amount: Scalars['Int'];
  transaction_type: Scalars['String'];
  reason: Scalars['String'];
  reference_id?: Maybe<Scalars['String']>;
  created_at: Scalars['DateTime'];
  expires_at?: Maybe<Scalars['DateTime']>;
}};

// Input Types
export type RedeemRewardInput = {{
  reward_id: Scalars['String'];
  customer_id: Scalars['String'];
  quantity?: InputMaybe<Scalars['Int']>;
}};

export type TrackActionInput = {{
  customer_id: Scalars['String'];
  action_type: Scalars['String'];
  metadata?: InputMaybe<Scalars['String']>;
}};

// Result Types
export type RedemptionResult = {{
  __typename?: 'RedemptionResult';
  success: Scalars['Boolean'];
  message: Scalars['String'];
  redemption_id?: Maybe<Scalars['String']>;
  discount_code?: Maybe<Scalars['String']>;
  points_deducted?: Maybe<Scalars['Int']>;
  new_balance?: Maybe<Scalars['Int']>;
}};

// Query Types
export type Query = {{
  __typename?: 'Query';
  loyaltyProfile?: Maybe<LoyaltyProfile>;
  availableRewards: Array<Reward>;
  pointsHistory: Array<PointsTransaction>;
  earningOpportunities: Array<PointsEarningOpportunity>;
}};

// Mutation Types
export type Mutation = {{
  __typename?: 'Mutation';
  redeemReward: RedemptionResult;
  trackAction: Scalars['Boolean'];
}};

// Query Variables
export type GetCustomerLoyaltyProfileQueryVariables = Exact<{{
  customerId: Scalars['String'];
}}>;

export type GetCustomerLoyaltyProfileQuery = {{
  __typename?: 'Query';
  loyaltyProfile?: {{
    __typename?: 'LoyaltyProfile';
    id: string;
    customer_id: string;
    points_balance: number;
    lifetime_points: number;
    current_tier?: {{
      __typename?: 'Tier';
      id: string;
      name: string;
      level: number;
      min_points_required: number;
      description?: string | null;
      benefits: Array<string>;
      icon_url?: string | null;
      color?: string | null;
    }} | null;
    next_tier?: {{
      __typename?: 'Tier';
      id: string;
      name: string;
      level: number;
      min_points_required: number;
      description?: string | null;
    }} | null;
    points_to_next_tier?: number | null;
    tier_progress_percentage: number;
    member_since: string;
    last_activity?: string | null;
  }} | null;
}};

export type RedeemRewardMutationVariables = Exact<{{
  input: RedeemRewardInput;
}}>;

export type RedeemRewardMutation = {{
  __typename?: 'Mutation';
  redeemReward: {{
    __typename?: 'RedemptionResult';
    success: boolean;
    message: string;
    redemption_id?: string | null;
    discount_code?: string | null;
    points_deducted?: number | null;
    new_balance?: number | null;
  }};
}};

// GraphQL Client SDK
export interface Sdk {{
  GetCustomerLoyaltyProfile(variables: GetCustomerLoyaltyProfileQueryVariables): Promise<GetCustomerLoyaltyProfileQuery>;
  RedeemReward(variables: RedeemRewardMutationVariables): Promise<RedeemRewardMutation>;
  TrackCustomerAction(variables: TrackCustomerActionMutationVariables): Promise<TrackCustomerActionMutation>;
}}

export function getSdk(client: any): Sdk {{
  return {{
    GetCustomerLoyaltyProfile: (variables: GetCustomerLoyaltyProfileQueryVariables) =>
      client.request(GetCustomerLoyaltyProfileDocument, variables),
    RedeemReward: (variables: RedeemRewardMutationVariables) =>
      client.request(RedeemRewardDocument, variables),
    TrackCustomerAction: (variables: TrackCustomerActionMutationVariables) =>
      client.request(TrackCustomerActionDocument, variables),
  }};
}}

// GraphQL Documents
export const GetCustomerLoyaltyProfileDocument = `
  query GetCustomerLoyaltyProfile($customerId: String!) {{
    loyaltyProfile(customerId: $customerId) {{
      id
      customer_id
      points_balance
      lifetime_points
      current_tier {{
        id
        name
        level
        min_points_required
        description
        benefits
        icon_url
        color
      }}
      next_tier {{
        id
        name
        level
        min_points_required
        description
      }}
      points_to_next_tier
      tier_progress_percentage
      member_since
      last_activity
    }}
  }}
`;

export const RedeemRewardDocument = `
  mutation RedeemReward($input: RedeemRewardInput!) {{
    redeemReward(input: $input) {{
      success
      message
      redemption_id
      discount_code
      points_deducted
      new_balance
    }}
  }}
`;
'''

    # Write to file
    output_file = Path(output_path)
    output_file.parent.mkdir(parents=True, exist_ok=True)
    output_file.write_text(typescript_content)

    print(f"TypeScript types generated: {output_path}")

def generate_documentation():
    """Generate GraphQL API documentation"""

    schema_sdl = generate_schema_sdl()

    documentation = f'''
# GraphQL API Documentation

## Overview
This GraphQL API provides access to loyalty program data for both storefront and admin use cases.

## Endpoints
- **Storefront**: `/graphql` (public access with shop domain)
- **Admin**: `/graphql` (authenticated access with session token)

## Authentication

### Storefront Access
```http
POST /graphql
Content-Type: application/json
X-Shopify-Shop-Domain: your-shop.myshopify.com
X-Shopify-Storefront-Access-Token: your-storefront-token
```

### Admin Access
```http
POST /graphql
Content-Type: application/json
X-Shopify-Shop-Domain: your-shop.myshopify.com
Authorization: Bearer your-session-token
```

## Schema

```graphql
{schema_sdl}
```

## Example Queries

### Get Customer Loyalty Profile
```graphql
query GetCustomerLoyalty($customerId: String!) {{
  loyaltyProfile(customerId: $customerId) {{
    points_balance
    current_tier {{
      name
      level
    }}
    tier_progress_percentage
  }}
}}
```

### Redeem Reward
```graphql
mutation RedeemReward($input: RedeemRewardInput!) {{
  redeemReward(input: $input) {{
    success
    message
    discount_code
    new_balance
  }}
}}
```

## Rate Limiting
- Storefront: 100 requests per minute per shop
- Admin: 500 requests per minute per shop

## Error Handling
All errors follow GraphQL specification with additional error codes:
- `AUTHENTICATION_ERROR`: Invalid or missing authentication
- `AUTHORIZATION_ERROR`: Insufficient permissions
- `VALIDATION_ERROR`: Invalid input data
- `RATE_LIMIT_ERROR`: Too many requests
- `INTERNAL_ERROR`: Server error
'''

    # Write documentation
    doc_file = Path("../docs/graphql-api.md")
    doc_file.parent.mkdir(parents=True, exist_ok=True)
    doc_file.write_text(documentation)

    print("Documentation generated: ../docs/graphql-api.md")

def generate_test_queries():
    """Generate test queries for development"""

    test_queries = {{
        "storefront_queries": {{
            "get_loyalty_profile": {{
                "query": """
                query GetLoyaltyProfile($customerId: String!) {{
                  loyaltyProfile(customerId: $customerId) {{
                    id
                    points_balance
                    current_tier {{ name level }}
                    tier_progress_percentage
                  }}
                }}
                """,
                "variables": {{"customerId": "test-customer-123"}}
            }},
            "get_rewards": {{
                "query": """
                query GetRewards($maxPoints: Int) {{
                  availableRewards(maxPoints: $maxPoints) {{
                    id
                    name
                    points_cost
                    description
                  }}
                }}
                """,
                "variables": {{"maxPoints": 1000}}
            }}
        }},
        "admin_queries": {{
            "get_analytics": {{
                "query": """
                query GetAnalytics {{
                  loyaltyAnalytics {{
                    total_customers
                    active_customers_30d
                    redemption_rate
                    top_rewards {{
                      reward {{ name }}
                      redemption_count
                    }}
                  }}
                }}
                """,
                "variables": {{}}
            }}
        }},
        "mutations": {{
            "redeem_reward": {{
                "query": """
                mutation RedeemReward($input: RedeemRewardInput!) {{
                  redeemReward(input: $input) {{
                    success
                    message
                    discount_code
                    new_balance
                  }}
                }}
                """,
                "variables": {{
                    "input": {{
                        "customer_id": "test-customer-123",
                        "reward_id": "reward-456",
                        "quantity": 1
                    }}
                }}
            }}
        }}
    }}

    # Write test queries
    test_file = Path("../tests/graphql_test_queries.json")
    test_file.parent.mkdir(parents=True, exist_ok=True)
    test_file.write_text(json.dumps(test_queries, indent=2))

    print("Test queries generated: ../tests/graphql_test_queries.json")

if __name__ == "__main__":
    print("Generating GraphQL schema artifacts...")

    # Generate all artifacts
    generate_typescript_types()
    generate_documentation()
    generate_test_queries()

    # Print schema SDL for verification
    print("\\nSchema SDL:")
    print(generate_schema_sdl())

    print("\\nAll artifacts generated successfully!")
