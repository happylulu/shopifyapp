"use client";
import { useAppBridge } from "@shopify/app-bridge-react";
import { useEffect } from "react";
import { doWebhookRegistration, storeToken } from "../actions";

// Component that uses App Bridge (only rendered in Shopify environment)
function ShopifySessionHandler() {
  const app = useAppBridge();

  useEffect(() => {
    app.idToken().then((token: string) => {
      storeToken(token)
        .then(() => {
          console.log("Token stored");
        })
        .catch((error: any) => {
          console.error("Error storing token", error);
        });
      doWebhookRegistration(token)
        .then(() => {
          console.log("Webhook registered");
        })
        .catch((error: any) => {
          console.error("Error registering webhook", error);
        });
    }).catch((error: any) => {
      console.warn("Failed to get ID token:", error);
    });
  }, [app]);

  return null;
}

export default function SessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check if we're in a Shopify environment
  const isShopifyEnvironment = typeof window !== 'undefined' &&
    (window.location.hostname.includes('shopify') ||
     window.location.search.includes('shop=') ||
     window.location.hostname.includes('ngrok') ||
     process.env.NODE_ENV === 'production');

  useEffect(() => {
    if (!isShopifyEnvironment) {
      console.log("Running in development mode without App Bridge");
    }
  }, [isShopifyEnvironment]);

  return (
    <>
      {isShopifyEnvironment && <ShopifySessionHandler />}
      {children}
    </>
  );
}
