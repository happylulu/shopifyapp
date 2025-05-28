"use client";

import React from 'react';

// Mock App Bridge for development
const mockApp = {
  idToken: () => Promise.resolve('mock-token'),
};

const mockAuthFetch = (url: string) => fetch(url);

// Check if we're in a Shopify environment
function isShopifyEnvironment() {
  return typeof window !== 'undefined' && 
    (window.location.hostname.includes('shopify') || 
     window.location.search.includes('shop=') ||
     window.location.hostname.includes('ngrok'));
}

// Component that uses real App Bridge
function ShopifyAppBridgeComponent({ children }: { children: (app: any, authFetch: any) => React.ReactNode }) {
  const { useAppBridge } = require('@shopify/app-bridge-react');
  const { useAuthenticatedFetch } = require('../hooks/useAuthenticatedFetch');
  
  const app = useAppBridge();
  const authFetch = useAuthenticatedFetch();
  
  return <>{children(app, authFetch)}</>;
}

// Component that uses mock App Bridge
function MockAppBridgeComponent({ children }: { children: (app: any, authFetch: any) => React.ReactNode }) {
  return <>{children(mockApp, mockAuthFetch)}</>;
}

// Wrapper component that conditionally renders based on environment
export default function AppBridgeWrapper({ children }: { children: (app: any, authFetch: any) => React.ReactNode }) {
  const [isShopify, setIsShopify] = React.useState(false);
  
  React.useEffect(() => {
    setIsShopify(isShopifyEnvironment());
  }, []);

  if (isShopify) {
    return <ShopifyAppBridgeComponent>{children}</ShopifyAppBridgeComponent>;
  }
  
  return <MockAppBridgeComponent>{children}</MockAppBridgeComponent>;
}
