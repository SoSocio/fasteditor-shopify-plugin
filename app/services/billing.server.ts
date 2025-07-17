import type {authenticateAdmin, unauthenticatedAdmin} from "../types/app.types";
import type {AppSubscription, BillingCheckResponseObject, UsageRecord} from "@shopify/shopify-api";
import type {CreateAppUsageRecordResponse, UsagePrice} from "../types/billing.types";
import {IS_TEST_BILLING} from "../constants";
import {adminGraphqlRequest, getAppByKey} from "./app.server";
import {CREATE_APP_USAGE_RECORD} from "../graphql/billing/createAppUsageRecord";
import type {authenticate} from "../shopify.server";
import {MONTHLY_PLAN} from "../shopify.server";

/**
 * Ensures the shop has an active subscription.
 * If not, it triggers a billing request with a redirect to the success URL.
 *
 * @param admin - Shopify Admin GraphQL client
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
 * Creates a usage record using a direct GraphQL mutation to Shopify Admin API.
 *
 * @param admin - Shopify Admin GraphQL client
 * @param description - Usage charge description
 * @param price - Object with amount and currency code
 * @param subscriptionLineItemId - The ID of the usage subscription line item
 * @returns Raw result from appUsageRecordCreate mutation
 */
export async function createAppUsageRecord(
  admin: unauthenticatedAdmin,
  description: string,
  price: UsagePrice,
  subscriptionLineItemId: string,
): Promise<any> {
  const response = await adminGraphqlRequest<CreateAppUsageRecordResponse>(
    admin, CREATE_APP_USAGE_RECORD, {
      variables: {
        description,
        price,
        subscriptionLineItemId,
      }
    })
  return response.appUsageRecordCreate
}
