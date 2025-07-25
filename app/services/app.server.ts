import type {
  AppByKeyResponse,
  AppInfo,
  AppSubscription,
  authenticateAdmin,
  CurrentAppInstallationResponse,
  unauthenticatedAdmin
} from "../types/app.types";
import {GET_APP_BY_KEY} from "../graphql/app/getAppByKey";
import {APP_CLIENT_ID} from "../constants";
import {GET_CURRENT_APP_INSTALLATION} from "../graphql/app/getCurrentAppInstallation";
import {METAFIELD_SET} from "../graphql/metafields/metafieldsSet";
import {APP_INSTALLATION_ID_FRAGMENT} from "../graphql/app/fragments/appInstallationIdFragment";

/**
 * Executes a Shopify Admin API GraphQL query with error handling.
 *
 * @param admin - Shopify Admin API client
 * @param query - GraphQL query string
 * @param variables - Optional query variables
 * @returns The data field from the GraphQL response
 * @throws Error when response is not ok or parsing fails
 */
export async function adminGraphqlRequest<T = any>(
  admin: unauthenticatedAdmin | authenticateAdmin,
  query: string,
  variables?: Record<string, any>
): Promise<T> {
  try {
    const request = await admin.graphql(query, variables);

    if (!request.ok) {
      const errorText = await request.text();
      console.error("[ShopifyGraphQL] Response error:", errorText);
      throw new Error(errorText);
    }

    const response = await request.json();
    return response.data;
  } catch (error) {
    console.error("[ShopifyGraphQL] Execution error:", error);
    throw error;
  }
}

/**
 * Retrieves the app information by the public app client ID.
 *
 * @param admin - Shopify Admin API client
 * @returns App information object
 */
export async function getAppByKey(
  admin: unauthenticatedAdmin
): Promise<AppInfo> {
  const response = await adminGraphqlRequest<AppByKeyResponse>(
    admin,
    GET_APP_BY_KEY,
    {variables: {clientId: APP_CLIENT_ID}}
  );

  return response.appByKey;
}

/**
 * Retrieves the subscription line item ID corresponding to usage-based billing.
 *
 * @param admin - Shopify Admin API client
 * @returns Line item ID string or null if not found
 */
export async function getUsageBillingLineItemId(
  admin: unauthenticatedAdmin
): Promise<string | null> {
  const monthlySubscription = await fetchMonthlySubscription(admin)

  if (!monthlySubscription) {
    console.warn("[Subscription] Monthly subscription not found");
    return null;
  }

  const usageLineItem = monthlySubscription.lineItems.find(
    (item) => item.plan.pricingDetails.__typename === "AppUsagePricing"
  );

  return usageLineItem?.id ?? null;
}

/**
 * Finds the monthly subscription from the active subscriptions list.
 *
 * @param admin - Shopify Admin API client
 * @returns The monthly AppSubscription or null if none found
 */
export async function fetchMonthlySubscription(
  admin: unauthenticatedAdmin
): Promise<AppSubscription | null> {
  const activeSubscriptions = await fetchCurrentAppSubscriptions(admin);

  return activeSubscriptions.find((sub) => sub.name === "Monthly subscription") || null;
}

/**
 * Retrieves the current app installation details including active subscriptions.
 *
 * @param admin - Shopify Admin API client
 * @returns Array of active AppSubscription objects
 */
export async function fetchCurrentAppSubscriptions(
  admin: unauthenticatedAdmin
): Promise<AppSubscription[]> {
  const response = await adminGraphqlRequest<CurrentAppInstallationResponse>(
    admin,
    GET_CURRENT_APP_INSTALLATION,
    {variables: {clientId: APP_CLIENT_ID}}
  );

  return response.currentAppInstallation.activeSubscriptions
}

/**
 * Throws 405 Method Not Allowed response if the HTTP method is not in the allowed list.
 *
 * @param request - Incoming request object
 * @param allowedMethods - Array of allowed HTTP methods (e.g., ['POST'])
 * @param endpoint - Endpoint path string for logging context
 * @throws Response with 405 status if method is not allowed
 */
export function actionMethodNotAllowed(
  {
    request,
    allowedMethods,
    endpoint,
  }: {
    request: Request;
    allowedMethods: string[];
    endpoint: string;
  }) {
  if (!allowedMethods.includes(request.method)) {
    console.error(`${request.method} not allowed on ${endpoint}. URL: ${request.url}`);
    throw new Response(null, {status: 405, statusText: "Method Not Allowed"});
  }
}

/**
 * Throws 405 Method Not Allowed response for GET requests (commonly for loaders).
 *
 * @param request - Incoming request object
 * @param endpoint - Endpoint path string for logging context
 * @throws Response with 405 status for GET requests
 */
export function loaderMethodNotAllowed(
  {
    request,
    endpoint,
  }: {
    request: Request;
    endpoint: string;
  }) {
  console.error(`GET not allowed on ${endpoint}. URL: ${request.url}`);
  throw new Response(null, {status: 405, statusText: "Method Not Allowed"});
}

/**
 * Generates a consistent JSON error response and logs the error.
 *
 * @param error - Error object or Response instance caught during processing
 * @param endpoint - Endpoint path string for contextual logging
 * @param defaultMessage - Optional default error message for response body
 * @returns JSON Response with error message and HTTP status code
 */
export async function errorResponse(
  error: unknown,
  endpoint: string,
  defaultMessage = "Request failed"
): Promise<Response> {
  const status = error instanceof Response ? error.status : 500;

  const message =
    error instanceof Response
      ? await error.text()
      : error instanceof Error
        ? error.message
        : String(error);

  console.error(`[${endpoint}] Error:`, message);

  return new Response(
    JSON.stringify({
      error: defaultMessage,
      message,
    }),
    {
      status,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
}

/**
 * Updates the "paid" metafield for the current app installation.
 *
 * @param admin - Authenticated Shopify Admin API client
 * @param isActive - Boolean string value representing subscription status
 * @returns Shopify metafieldsSet response
 * @throws Response if app installation ID is missing or GraphQL request fails
 */
export async function updatePaidStatusMetafield(
  admin: authenticateAdmin,
  isActive: string
): Promise<any> {
  const appInstallationId = await fetchAppInstallationId(admin);
  const response = await setPaidMetafield(admin, appInstallationId, isActive);

  console.info("[updatePaidStatusMetafield] Metafield updated:", response.metafieldsSet);
  return response;
}

/**
 * Fetches the current app installation ID via Shopify Admin GraphQL.
 *
 * @param admin - Authenticated Shopify Admin API client
 * @returns App installation ID string
 * @throws Response if ID is not found
 */
async function fetchAppInstallationId(admin: authenticateAdmin): Promise<string> {
  console.info("[fetchAppInstallationId] Fetching app installation ID...");

  const response = await adminGraphqlRequest(admin, `
    #graphql
    query GetCurrentAppInstallation {
      currentAppInstallation {
        ...AppInstallationIdFragment
      }
    }
    ${APP_INSTALLATION_ID_FRAGMENT}
  `);

  const appInstallationId = response?.currentAppInstallation?.id;

  if (!appInstallationId) {
    console.error("[fetchAppInstallationId] App installation ID not found");
    throw new Response("App installation ID not found", {status: 404});
  }

  console.info("[fetchAppInstallationId] Found app installation ID:", appInstallationId);
  return appInstallationId;
}

/**
 * Sends a metafield mutation to Shopify to update the "paid" status.
 *
 * @param admin - Authenticated Shopify Admin API client
 * @param appInstallationId - ID of the app installation
 * @param value - Boolean string value ("true" or "false")
 * @returns Shopify metafieldsSet response
 */
async function setPaidMetafield(
  admin: authenticateAdmin,
  appInstallationId: string,
  value: string
): Promise<any> {
  console.info("[setPaidMetafield] Setting paid metafield with value:", value);

  return await adminGraphqlRequest(admin, METAFIELD_SET, {
    variables: {
      metafields: [
        {
          namespace: "appInstallation",
          key: "paid",
          type: "boolean",
          value,
          ownerId: appInstallationId,
        },
      ],
    },
  });
}
