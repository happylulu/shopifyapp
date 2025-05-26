"use client";

import { useAppBridge } from "@shopify/app-bridge-react";
import { authenticatedFetch } from "@shopify/app-bridge/utilities";

/**
 * Returns a fetch function that automatically includes a valid session token
 * using Shopify App Bridge utilities.
 */
export function useAuthenticatedFetch() {
  const app = useAppBridge();
  return authenticatedFetch(app);
}
