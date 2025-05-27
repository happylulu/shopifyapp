export interface Money {
  amount: string;
  currencyCode: string;
}

export interface BuyerIdentity {
  customer?: {
    id: string;
    email?: string;
    phone?: string;
    totalSpent?: Money;
  } | null;
  email?: string;
  phone?: string;
}

export interface Cart {
  buyerIdentity: BuyerIdentity;
}

export interface RunInput {
  cart: Cart;
}

export interface FunctionRunResult {
  discountApplicationStrategy: "FIRST" | "MAXIMUM" | "ALL";
  discounts: unknown[];
}
