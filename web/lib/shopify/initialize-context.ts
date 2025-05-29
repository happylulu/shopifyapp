import "@shopify/shopify-api/adapters/web-api";
import {
  shopifyApi,
  LATEST_API_VERSION,
  LogSeverity,
} from "@shopify/shopify-api";

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
});

export default shopify;
