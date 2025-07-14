import {APP_CLIENT_ID} from "../constants";
import {GET_APP_BY_KEY} from "../graphql/app/getAppByKey";
import {GET_CURRENT_APP_INSTALLATION} from "../graphql/app/getCurrentAppInstallation";
import type {unauthenticatedAdmin} from "../types/shopify";

interface AppInfo {
  title: string;
  handle: string;
}

interface AppSubscriptionLineItem {
  id: string;
  plan: {
    pricingDetails: {
      __typename: "AppUsagePricing" | "AppRecurringPricing";
    }
  }
}

interface AppSubscription {
  id: string;
  name: string;
  lineItems: AppSubscriptionLineItem[];
}

interface CurrentAppInstallationResponse {
  currentAppInstallation: {
    activeSubscriptions: AppSubscription[];
  };
}

interface AppByKeyResponse {
  appByKey: AppInfo;
}

/**
 * Executes a GraphQL query via Shopify Admin API client with proper error handling.
 */
export async function adminGraphqlRequest<T = any>(
  admin: any,
  query: string,
  variables?: Record<string, any>
): Promise<T> {
  try {
    const response = await admin.graphql(query, variables);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Shopify GraphQL error:", errorText);
      throw new Error(errorText);
    }

    const responseJson = await response.json();
    return responseJson.data;
  } catch (error) {
    console.error("Shopify GraphQL error:", error);
    throw error;
  }
}

/**
 * Fetches App info from Shopify by the public app client ID.
 */
export async function getAppByKey(
  admin: unauthenticatedAdmin
): Promise<AppInfo> {
  const response = await adminGraphqlRequest<AppByKeyResponse>(admin, GET_APP_BY_KEY, {
    variables: {clientId: APP_CLIENT_ID}
  })

  return response.appByKey
}

/**
 * Returns the ID of the usage-based subscription line item.
 */
export async function getUsageAppSubscriptionLineItemId(
  admin: unauthenticatedAdmin
): Promise<string | null> {
  const monthSubscription = await getMonthlyAppSubscription(admin)
  const lineItem = monthSubscription?.lineItems.find(
    (item) => item.plan.pricingDetails.__typename === "AppUsagePricing"
  );

  return lineItem?.id ?? null;
}

/**
 * Finds the monthly subscription from current active subscriptions.
 */
export async function getMonthlyAppSubscription(
  admin: unauthenticatedAdmin
): Promise<AppSubscription | null> {
  const appSubscriptions = await getCurrentAppInstallation(admin)

  return appSubscriptions.find((sub) => sub.name === "Monthly subscription") || null;
}

/**
 * Returns the current app installation info with all active subscriptions.
 */
export async function getCurrentAppInstallation(
  admin: unauthenticatedAdmin
): Promise<AppSubscription[]> {
  const response = await adminGraphqlRequest<CurrentAppInstallationResponse>(
    admin,
    GET_CURRENT_APP_INSTALLATION,
    {variables: {clientId: APP_CLIENT_ID}}
  );

  return response.currentAppInstallation.activeSubscriptions
}
