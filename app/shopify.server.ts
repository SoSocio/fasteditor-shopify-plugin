import "@shopify/shopify-app-remix/adapters/node";
import {
  ApiVersion,
  AppDistribution,
  BillingInterval,
  shopifyApp,
} from "@shopify/shopify-app-remix/server";
import {PrismaSessionStorage} from "@shopify/shopify-app-session-storage-prisma";
import prisma from "./db.server";

export const MONTHLY_PLAN = "Monthly subscription";

/**
 * Shopify app instance configured for this project.
 * Handles authentication, session storage, and API configuration.
 */
const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
  apiVersion: ApiVersion.January25,
  scopes: process.env.SCOPES?.split(","),
  appUrl: process.env.SHOPIFY_APP_URL || "",
  authPathPrefix: "/auth",
  sessionStorage: new PrismaSessionStorage(prisma),
  distribution: AppDistribution.AppStore,
  billing: {
    [MONTHLY_PLAN]: {
      lineItems: [
        {
          amount: 95,
          currencyCode: 'USD',
          interval: BillingInterval.Every30Days,
        },
        {
          amount: 9999,
          currencyCode: 'USD',
          interval: BillingInterval.Usage,
          terms: "2% of the total sales value of products customized using FastEditor"
        }
      ],
    }
  },
  future: {
    unstable_newEmbeddedAuthStrategy: true,
    removeRest: true,
  },
  ...(process.env.SHOP_CUSTOM_DOMAIN
    ? {customShopDomains: [process.env.SHOP_CUSTOM_DOMAIN]}
    : {}),
});

/**
 * The main Shopify app instance for use throughout the server.
 */
export default shopify;

/**
 * The current Shopify API version used by the app.
 */
export const apiVersion = ApiVersion.January25;

/**
 * Adds required document response headers for Shopify app.
 */
export const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;

/**
 * Shopify authentication helpers.
 */
export const authenticate = shopify.authenticate;
export const unauthenticated = shopify.unauthenticated;
export const login = shopify.login;
export const registerWebhooks = shopify.registerWebhooks;
export const sessionStorage = shopify.sessionStorage;
