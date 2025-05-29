"use client";
import { useAppBridge } from "@shopify/app-bridge-react";
import { useEffect, useState } from "react";
import { doWebhookRegistration, storeToken } from "../actions";

// Component that uses App Bridge (only rendered when App Bridge is available)
function ShopifySessionHandler() {
  const app = useAppBridge();

  useEffect(() => {
    if (!app) {
      console.warn("App Bridge not available in ShopifySessionHandler");
      return;
    }

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
  useEffect(() => {
    console.log("SessionProvider initialized");
  }, []);

  return (
    <>
      {children}
    </>
  );
}
