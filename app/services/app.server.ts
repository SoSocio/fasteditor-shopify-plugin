import type {
  AppByKeyResponse,
  AppInfo,
  AppSubscription,
  CurrentAppInstallationResponse
} from "../types/app.types";
import type {unauthenticatedAdmin} from "../types/shopify";
import {GET_APP_BY_KEY} from "../graphql/app/getAppByKey";
import {APP_CLIENT_ID} from "../constants";
import {GET_CURRENT_APP_INSTALLATION} from "../graphql/app/getCurrentAppInstallation";

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
