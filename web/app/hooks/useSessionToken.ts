"use client";

import { useAppBridge } from "@shopify/app-bridge-react";
import { getSessionToken } from "@shopify/app-bridge/utilities";

/**
 * Returns a function that resolves with a session token retrieved from
 * Shopify App Bridge.
 */
export function useSessionToken() {
  const app = useAppBridge();
  return () => getSessionToken(app);
}
