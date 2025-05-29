"use client";

import { useAppBridge } from "@shopify/app-bridge-react";
import { authenticatedFetch } from "@shopify/app-bridge/utilities";

/**
 * Returns a fetch function that automatically includes a valid session token
 * using Shopify App Bridge utilities.
 */
export function useAuthenticatedFetch() {
  try {
    const app = useAppBridge();

    if (!app) {
      console.log('🔍 [useAuthenticatedFetch] App Bridge not available, using regular fetch');
      return fetch;
    }

    // Check if this is a real App Bridge instance or a mock
    if (typeof app.idToken === 'function' && !app.subscribe) {
      console.log('🔍 [useAuthenticatedFetch] Mock App Bridge detected, creating custom authenticated fetch');

      // For mock environment, create a custom authenticated fetch that adds the mock token
      return async (url: string | URL | Request, options: RequestInit = {}) => {
        try {
          const token = await app.idToken();
          const headers = new Headers(options.headers);
          headers.set('Authorization', `Bearer ${token}`);

          return fetch(url, {
            ...options,
            headers,
          });
        } catch (error) {
          console.warn('Failed to get mock token, using regular fetch:', error);
          return fetch(url, options);
        }
      };
    }

    // For real App Bridge, use the official authenticatedFetch
    console.log('🔍 [useAuthenticatedFetch] Real App Bridge detected, using authenticatedFetch');
    return authenticatedFetch(app);
  } catch (error) {
    console.warn('App Bridge error, falling back to regular fetch:', error);
    return fetch;
  }
}
