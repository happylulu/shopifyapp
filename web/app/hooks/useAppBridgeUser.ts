"use client";

import { useAppBridge } from "@shopify/app-bridge-react";
import { useEffect, useState } from "react";

export interface AppBridgeUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  accountOwner: boolean;
}

/**
 * Retrieves the current merchant staff user via the App Bridge User API.
 * Returns `null` when the user is not available.
 */
export function useAppBridgeUser() {
  const shopify = useAppBridge();
  const [user, setUser] = useState<AppBridgeUser | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchUser() {
      try {
        const current = await (shopify as any)?.user?.current();
        if (!cancelled) setUser(current || null);
      } catch {
        if (!cancelled) setUser(null);
      }
    }

    fetchUser();
    return () => {
      cancelled = true;
    };
  }, [shopify]);

  return user;
}
