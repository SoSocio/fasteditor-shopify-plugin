import type {authenticateAdmin, unauthenticatedAdmin} from "../types/app.types";
import type {
  AppSubscription,
  BillingCheckResponseObject,
  UsageRecord,
  RecurringAppPlan,
  UsageAppPlan,
} from "@shopify/shopify-api";
import type {
  ActiveSubscription,
  AppRecurringPricing,
  AppUsagePricing,
  CreateAppUsageRecordResponse,
  UsagePrice
} from "../types/billing.types";
import {IS_TEST_BILLING} from "../constants";
import {adminGraphqlRequest, getAppByKey} from "./app.server";
import {CREATE_APP_USAGE_RECORD} from "../graphql/billing/createAppUsageRecord";
import type {authenticate} from "../shopify.server";
import {MONTHLY_PLAN} from "../shopify.server";
import {ACTIVE_SUBSCRIPTIONS_FRAGMENT} from "../graphql/app/fragments/activeSubscriptionsFragment";

/**
 * Ensures the shop has an active subscription.
 * If not, it triggers a billing request with a redirect to the success URL.
 *
 * @param admin - Shopify Admin API client
 * @param billing - Billing object from `authenticate.admin`
 * @param shop - The shop domain.
 * @returns Billing check response object
 */
export async function billingRequire(
  admin: authenticateAdmin,
  billing: Awaited<ReturnType<typeof authenticate.admin>>["billing"],
  shop: string
): Promise<BillingCheckResponseObject> {
  const shopName = shop.replace(".myshopify.com", "");
  const appInfo = await getAppByKey(admin);

  return await billing.require({
    plans: [MONTHLY_PLAN],
    onFailure: async () =>
      billing.request({
        plan: MONTHLY_PLAN,
        isTest: IS_TEST_BILLING,
        returnUrl: `https://admin.shopify.com/store/${shopName}/apps/${appInfo.handle}/app/subscription/success`,
      }),
  });
}

/**
 * Checks if the shop has an active subscription.
 *
 * @param billing - Billing object from `authenticate.admin`
 * @returns Billing check response object
 */
export async function billingCheck(
  billing: Awaited<ReturnType<typeof authenticate.admin>>["billing"]
): Promise<BillingCheckResponseObject> {
  return await billing.check({
    plans: [MONTHLY_PLAN],
    isTest: IS_TEST_BILLING,
  });
}

/**
 * Cancels the active subscription by subscription ID.
 *
 * @param billing - Billing object from `authenticate.admin`
 * @param subscriptionId - ID of the active subscription to cancel
 * @returns Canceled AppSubscription object
 */
export async function billingCancel(
  billing: Awaited<ReturnType<typeof authenticate.admin>>["billing"],
  subscriptionId: string
): Promise<AppSubscription> {
  return await billing.cancel({
    subscriptionId,
    isTest: IS_TEST_BILLING,
  });
}

/**
 * Creates a usage record (charge) for a specific billing plan.
 * Used when charging per usage instead of a flat monthly fee.
 *
 * @param billing - Billing object from `authenticate.admin`
 * @param description - Description of the usage charge (shown in merchant’s invoice)
 * @param price - Object with amount and currencyCode (e.g. { amount: 20, currencyCode: 'USD' })
 * @returns Created UsageRecord object
 */
export async function billingCreateUsageRecord(
  billing: Awaited<ReturnType<typeof authenticate.admin>>["billing"],
  description: string,
  price: UsagePrice
): Promise<UsageRecord> {
  return await billing.createUsageRecord({
    description,
    price,
    isTest: IS_TEST_BILLING,
  });
}

/**
 * Creates an app usage record via Shopify Admin GraphQL API.
 *
 * @param admin - Shopify Admin API client
 * @param description - Description of the usage charge.
 * @param price - Object containing amount and currencyCode.
 * @param subscriptionLineItemId - The ID of the subscription line item to which the usage charge
 *   applies.
 * @returns The result of `appUsageRecordCreate`, or throws an error if userErrors are returned.
 * @throws {Error} If the mutation returns userErrors.
 */
export async function createAppUsageRecord(
  admin: unauthenticatedAdmin,
  description: string,
  price: UsagePrice,
  subscriptionLineItemId: string,
): Promise<any> {
  const response = await adminGraphqlRequest<CreateAppUsageRecordResponse>(
    admin,
    CREATE_APP_USAGE_RECORD,
    {
      variables: {
        description,
        price,
        subscriptionLineItemId,
      }
    })

  const { userErrors } = response.appUsageRecordCreate;

  if (userErrors.length > 0) {
    console.error("[createAppUsageRecord] User errors:", userErrors);
    throw new Error("Failed to create app usage record due to user errors");
  }

  return response.appUsageRecordCreate;
}

/**
 * Fetches active app subscriptions using the Shopify GraphQL Admin API.
 *
 * @param admin - Shopify Admin API client
 * @returns Array of active subscriptions
 * @throws Error if the request fails or the response is malformed
 */
export async function fetchActiveSubscriptions(admin: authenticateAdmin): Promise<AppSubscription[]> {
  const response = await adminGraphqlRequest(admin, `
    #graphql
    query ActiveSubscriptions {
      currentAppInstallation {
        ...ActiveSubscriptionsFragment
      }
    }
    ${ACTIVE_SUBSCRIPTIONS_FRAGMENT}
  `)

  return response.currentAppInstallation.activeSubscriptions;
}

/**
 * Returns the first transformed active subscription.
 *
 * @param subscriptions - Raw app subscriptions
 * @returns Transformed active subscription object
 */
export function getActiveSubscription(subscriptions: AppSubscription[]): ActiveSubscription {
  const transformedSubscriptions = subscriptions.map((item) => (
      transformSubscription(item)
    )
  );

  return transformedSubscriptions[0]
}

/**
 * Extracts and formats recurring pricing details from a subscription.
 *
 * @param subscription - Single AppSubscription
 * @returns Recurring pricing object or fallback with default price
 */
function getAppRecurringPricing(subscription: AppSubscription): AppRecurringPricing {
  const line = subscription.lineItems?.find(
    (item) => item.plan.pricingDetails.__typename === "AppRecurringPricing"
  );

  const pricing = line?.plan.pricingDetails as RecurringAppPlan;
  const lineId = line?.id as string;

  return {
    id: lineId,
    price: pricing?.price
  }
}

/**
 * Extracts and formats usage pricing details from a subscription.
 *
 * @param subscription - Single AppSubscription
 * @returns Usage pricing object with balance, capped amount, and terms
 */
export function getAppUsagePricing(subscription: AppSubscription): AppUsagePricing {
  const line = subscription.lineItems?.find(
    (item) => item.plan.pricingDetails.__typename === "AppUsagePricing"
  );

  const pricing = line?.plan.pricingDetails as UsageAppPlan;
  const lineId = line?.id as string;

  return {
    id: lineId,
    balanceUsed: {
      amount: pricing?.balanceUsed?.amount ?? 0,
      currencyCode: pricing?.balanceUsed?.currencyCode ?? "USD",
    },
    cappedAmount: {
      amount: pricing?.cappedAmount?.amount ?? 0,
      currencyCode: pricing?.cappedAmount?.currencyCode ?? "USD",
    },
    terms: pricing?.terms ?? "",
  };
}

/**
 * Transforms raw AppSubscription data into a typed and clean ActiveSubscription.
 *
 * @param subscription - Raw subscription object
 * @returns Transformed ActiveSubscription
 */
function transformSubscription(subscription: AppSubscription): ActiveSubscription {
  return {
    id: subscription.id,
    name: subscription.name,
    status: subscription.status,
    trialDays: subscription.trialDays,
    createdAt: subscription.createdAt,
    currentPeriodEnd: subscription.currentPeriodEnd,
    usageLineItemId: getAppUsagePricing(subscription).id,
    appRecurringPricing: getAppRecurringPricing(subscription),
    appUsagePricing: getAppUsagePricing(subscription),
  };
}

