import type { RunInput, FunctionRunResult } from "./types";

/**
 * Example discount function demonstrating access to buyer identity.
 */
export function run(input: RunInput): FunctionRunResult {
  const { cart } = input;
  const buyer = cart.buyerIdentity;

  // Here you would apply custom logic based on buyerIdentity
  // such as loyalty status or B2B pricing.

  return {
    discountApplicationStrategy: "FIRST",
    discounts: [],
  };
}
