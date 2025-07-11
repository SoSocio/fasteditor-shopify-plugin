import type { AppSubscription, BillingCheckResponseObject, UsageRecord } from "@shopify/shopify-api";
import type { AdminGraphqlClient } from "@shopify/shopify-app-remix/server";
import { type authenticate, MONTHLY_PLAN } from "../shopify.server";
import { IS_TEST_BILLING } from "../constants";
import { getAppInfoByKey } from "./app.server";

type UsagePrice = {
  amount: number;
  currencyCode: string;
};

/**
 * Ensures the shop has an active subscription.
 * If not, it triggers a billing request with a redirect to the success URL.
 *
 * @param graphql - Admin GraphQL client
 * @param billing - Billing object from `authenticate.admin`
 * @param shop - The full shop domain (e.g. `example.myshopify.com`)
 * @returns Billing check response object
 */
export async function billingRequire(
  graphql: AdminGraphqlClient,
  billing: Awaited<ReturnType<typeof authenticate.admin>>["billing"],
  shop: string
): Promise<BillingCheckResponseObject> {
  const shopName = shop.replace(".myshopify.com", "");
  const appInfo = await getAppInfoByKey(graphql);

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
