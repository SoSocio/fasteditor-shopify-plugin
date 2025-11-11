import type {authenticateAdmin, unauthenticatedAdmin} from "../types/app.types";
import type {
  AppSubscription,
  BillingCheckResponseObject,
  RecurringAppPlan,
  UsageAppPlan,
  UsageRecord,
} from "@shopify/shopify-api";
import type {
  ActiveSubscription,
  AppRecurringPricing,
  AppUsagePricing,
  CreateAppUsageRecordResponse,
  UsagePrice
} from "../types/billing.types";
import {IS_TEST_BILLING, MS_IN_DAY} from "../constants";
import {adminGraphqlRequest} from "./app.server";
import {CREATE_APP_USAGE_RECORD} from "../graphql/billing/createAppUsageRecord";
import type {authenticate} from "../shopify.server";
import {MONTHLY_PLAN} from "../shopify.server";
import {ACTIVE_SUBSCRIPTIONS_FRAGMENT} from "../graphql/app/fragments/activeSubscriptionsFragment";

/**
 * Ensures the shop has an active subscription.
 * If not, it triggers a billing request with a redirect to the success URL.
 *
 * @param billing - Billing object from `authenticate.admin`
 * @param shop - The shop domain.
 * @param trialDays - Trial days value.
 * @returns Billing check response object
 */
export async function billingRequire(
  billing: Awaited<ReturnType<typeof authenticate.admin>>["billing"],
  shop: string,
  trialDays: number
): Promise<BillingCheckResponseObject> {
  return await billing.require({
    plans: [MONTHLY_PLAN],
    onFailure: async () =>
      billing.request({
        plan: MONTHLY_PLAN,
        trialDays,
        isTest: IS_TEST_BILLING,
        returnUrl: `https://${shop}/admin/apps/${process.env.SHOPIFY_API_KEY}/app/subscription/success`,
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

  const {userErrors} = response.appUsageRecordCreate;

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
export function transformSubscription(subscription: AppSubscription): ActiveSubscription {
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

/**
 * Calculates remaining trial days from a given end date.
 * Returns 0 if the date is invalid or in the past.
 *
 * @param trialEndDate - Trial end date to calculate remaining days from
 * @returns Number of remaining trial days (0 or positive)
 */
export function calculateRemainingTrialDays(trialEndDate: Date | null): number {
  if (!trialEndDate || isNaN(trialEndDate.getTime())) {
    return 0;
  }

  const diffMs = trialEndDate.getTime() - Date.now();
  const remainingDays = Math.ceil(diffMs / MS_IN_DAY);

  // Clamp negative values to 0
  return Math.max(remainingDays, 0);
}

/**
 * Calculates trial end date from start date and trial days duration.
 * Returns null if trial period is zero or undefined.
 *
 * @param startDate - Trial start date
 * @param trialDays - Number of trial days
 * @returns Trial end date or null
 */
export function calculateTrialEndDate(startDate: Date, trialDays: number | undefined): Date | null {
  if (!trialDays || trialDays <= 0) {
    return null;
  }
  return new Date(startDate.getTime() + trialDays * MS_IN_DAY);
}

/**
 * Converts charge_id from URL parameter to Shopify AppSubscription GID.
 *
 * @param chargeId - Charge ID from URL parameter
 * @returns Formatted GID string
 */
export function formatSubscriptionId(chargeId: string): string {
  return `gid://shopify/AppSubscription/${chargeId}`;
}

/**
 * Checks if the usage billing limit has been reached for the current subscription.
 *
 * @param admin - Shopify Admin API client
 * @returns true if the limit is reached (balanceUsed >= cappedAmount), false otherwise
 */
export async function checkUsageBillingLimitReached(
  admin: authenticateAdmin
): Promise<boolean> {
  try {
    const subscriptions = await fetchActiveSubscriptions(admin);
    
    if (!subscriptions || subscriptions.length === 0) {
      console.warn("[checkUsageBillingLimitReached] No active subscriptions found");
      return false;
    }

    const subscription = getActiveSubscription(subscriptions);
    const cappedAmount = Number(subscription.appUsagePricing.cappedAmount.amount);
    const balanceUsedAmount = Number(subscription.appUsagePricing.balanceUsed.amount);

    // If cappedAmount is 0, there's no limit, so it's never reached
    if (cappedAmount === 0) {
      return false;
    }

    // Limit is reached when balanceUsed >= cappedAmount
    const isLimitReached = balanceUsedAmount >= cappedAmount;

    console.info(
      `[checkUsageBillingLimitReached] Usage limit check: ${balanceUsedAmount}/${cappedAmount}, reached: ${isLimitReached}`
    );

    return isLimitReached;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[checkUsageBillingLimitReached] Error checking usage limit:", errorMessage);
    // On error, default to false (not reached) to avoid blocking the app
    return false;
  }
}
