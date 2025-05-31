import "@shopify/shopify-api/adapters/web-api";
import {
  shopifyApi,
  LATEST_API_VERSION,
  LogSeverity,
  Session,
} from "@shopify/shopify-api";
import { storeSession, loadSession, deleteSession, findSessionsByShop } from "../db/session-storage";

// Get hostname from various possible environment variables
const getHostName = () => {
  // Try different environment variable names that Shopify CLI might use
  const host = process.env.HOST ||
               process.env.SHOPIFY_APP_URL ||
               process.env.NEXT_PUBLIC_HOST ||
               process.env.NEXT_PUBLIC_SHOPIFY_APP_URL ||
               "localhost:3000"; // fallback for development

  // Remove protocol if present
  return host.replace(/https?:\/\//, "");
};

const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY || "",
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
  scopes: process.env.SCOPES?.split(",") || ["write_products"],
  hostName: getHostName(),
  hostScheme: process.env.NODE_ENV === "development" ? "http" : "https",
  isEmbeddedApp: true,
  apiVersion: LATEST_API_VERSION,
  logger: {
    level:
      process.env.NODE_ENV === "development"
        ? LogSeverity.Debug
        : LogSeverity.Error,
  },
  sessionStorage: {
    storeSession: async (session: Session) => {
      console.log('🔍 [Shopify Context] Storing session via custom storage');
      await storeSession(session);
      return true;
    },
    loadSession: async (id: string) => {
      console.log('🔍 [Shopify Context] Loading session via custom storage');
      return await loadSession(id);
    },
    deleteSession: async (id: string) => {
      console.log('🔍 [Shopify Context] Deleting session via custom storage');
      return await deleteSession(id);
    },
    deleteSessions: async (ids: string[]) => {
      console.log('🔍 [Shopify Context] Deleting multiple sessions');
      await Promise.all(ids.map(id => deleteSession(id)));
      return true;
    },
    findSessionsByShop: async (shop: string) => {
      console.log('🔍 [Shopify Context] Finding sessions by shop:', shop);
      return await findSessionsByShop(shop);
    },
  },
  webhooks: {
    "orders/paid": {
      deliveryMethod: "http",
      callbackUrl: "/api/webhooks/orders/paid",
    },
    "orders/create": {
      deliveryMethod: "http",
      callbackUrl: "/api/webhooks/orders/create",
    },
    "customers/create": {
      deliveryMethod: "http",
      callbackUrl: "/api/webhooks/customers/create",
    },
    "app/uninstalled": {
      deliveryMethod: "http",
      callbackUrl: "/api/webhooks/app/uninstalled",
    },
  },
});

export default shopify;
