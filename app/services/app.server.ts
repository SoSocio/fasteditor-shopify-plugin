import type {
  AppByKeyResponse,
  AppInfo,
  authenticateAdmin,
  unauthenticatedAdmin
} from "../types/app.types";
import {GET_APP_BY_KEY} from "../graphql/app/getAppByKey";
import {APP_CLIENT_ID} from "../constants";
import {APP_INSTALLATION_ID_FRAGMENT} from "../graphql/app/fragments/appInstallationIdFragment";
import {GET_APP_METAFIELD} from "../graphql/app/getAppMetafield";
import {setMetafield} from "./metafield.server";
import type {AppSubscription} from "@shopify/shopify-api";

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
 * Fetches the current app installation ID via Shopify Admin GraphQL.
 *
 * @param admin - Shopify Admin API client
 * @returns App installation ID string
 * @throws Response if ID is not found
 */
async function fetchAppInstallationId(admin: authenticateAdmin): Promise<string> {
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

  return appInstallationId;
}

/**
 * Retrieves a specific metafield from the current app installation.
 *
 * @param admin - Shopify Admin API client
 * @param namespace - Metafield namespace
 * @param key - Metafield key
 * @returns The metafield object retrieved from the Shopify Admin API
 */
export async function getAppMetafield(admin: authenticateAdmin, namespace: string, key: string): Promise<any> {
  const data = await adminGraphqlRequest(admin, GET_APP_METAFIELD, {
    variables: {
      namespace,
      key
    }
  });

  return data.currentAppInstallation.metafield;
}

/**
 * Sends a metafield mutation to Shopify to update the "paid" status.
 *
 * @param admin - Shopify Admin API client
 * @param value - Boolean string value ("true" or "false")
 * @returns Shopify metafieldsSet response
 */
export async function setPaidMetafield(
  admin: authenticateAdmin,
  value: string
): Promise<any> {
  const appInstallationId = await fetchAppInstallationId(admin);
  return await setMetafield(admin, "paid", "boolean", value, appInstallationId)
}

/**
 * Sets the "availability" metafield for the current app installation.
 *
 * @param admin - Shopify Admin API client
 * @param value - Stringified boolean value ("true" | "false")
 * @returns The response from the `metafieldsSet` mutation
 */
export async function setAppAvailabilityMetafield(
  admin: authenticateAdmin,
  value: string
): Promise<any> {
  const appInstallationId = await fetchAppInstallationId(admin);
  return await setMetafield(admin, "availability", "boolean", value, appInstallationId)
}

export async function getAllAppSubscriptions(admin: authenticateAdmin): Promise<AppSubscription[]> {
  const response = await adminGraphqlRequest(admin, `
    #graphql
    query ActiveSubscriptions {
      currentAppInstallation {
        allSubscriptions(first: 50) {
          nodes {
            createdAt
            currentPeriodEnd
            id
            lineItems {
              id
              plan {
                pricingDetails {
                  __typename
                  ... on AppRecurringPricing {
                    price {
                      amount
                      currencyCode
                    }
                  }
                  ... on AppUsagePricing {
                    balanceUsed {
                      amount
                      currencyCode
                    }
                    cappedAmount {
                      amount
                      currencyCode
                    }
                    terms
                  }
                }
              }
            }
            name
            returnUrl
            status
            test
            trialDays
          }
        }
      }
    }
  `)

  return response.currentAppInstallation.allSubscriptions.nodes
}
