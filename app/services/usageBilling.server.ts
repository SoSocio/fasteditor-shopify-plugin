import {
  findShopsWithFastEditorOrderItemsLastMonth,
  findUnbilledFastEditorOrderItemsLastMonth,
  updateUnbilledFastEditorOrderItemsLastMonth,
} from "../models/fastEditorOrderItems.server";
import type {authenticateAdmin} from "../types/app.types";
import type {Shop} from "../types/shop.types";
import type {UnbilledOrderItem} from "../types/billing.types";

import {
  createAppUsageRecord,
  fetchActiveSubscriptions,
  getActiveSubscription
} from "./billing.server";
import {createUsageBillingHistoryForShop} from "../models/usageBillingHistory.server";
import {unauthenticated} from "../shopify.server";
import {setAppAvailabilityMetafield} from "./app.server";

const ENDPOINT = "cron/usage-billing";

/**
 * Triggers usage billing for all shops with FastEditor activity in the last month.
 *
 * @returns void
 */
export async function processMonthlyUsageBilling(): Promise<void> {
  const activeShops = await getShopsWithActivity();

  for (const {shop} of activeShops) {
    const {admin} = await unauthenticated.admin(shop);
    await handleShopBilling(admin, shop);
  }
}

/**
 * Handles usage billing for a specific shop.
 *
 * @param admin - Authenticated Shopify Admin GraphQL client
 * @param shop - The shop domain
 * @returns void
 */
export async function handleShopBilling(
  admin: authenticateAdmin,
  shop: string,
): Promise<void> {
  const sinceDate = getOneMonthAgoDate();

  const subscriptions = await fetchActiveSubscriptions(admin)
  const subscription = getActiveSubscription(subscriptions)

  const usageLineItemId = subscription.usageLineItemId;
  if (!usageLineItemId) {
    console.warn(`[${ENDPOINT}] No active subscription for shop: ${shop}`);
    return;
  }

  const unbilledItems = await findUnbilledFastEditorOrderItemsLastMonth(shop, sinceDate);
  if (unbilledItems.length === 0) {
    console.info(`[${ENDPOINT}] No unbilled items for shop: ${shop}`);
    return;
  }

  const totalAmount = calculateTotalUsageFee(unbilledItems);
  if (totalAmount <= 0) {
    console.info(`[${ENDPOINT}] Total usage fee is 0 for shop: ${shop}`);
    return;
  }

  const cappedAmount = Number(subscription.appUsagePricing.cappedAmount.amount)
  const balanceUsedAmount = Number(subscription.appUsagePricing.balanceUsed.amount)

  const amountPaid = await applyUsageCharge(admin, cappedAmount, balanceUsedAmount, totalAmount, usageLineItemId);

  await markItemsAsBilled(shop, sinceDate);
  await recordBillingHistory(shop, amountPaid, unbilledItems.length);
}

/**
 * Applies usage charge.
 *
 * @param admin - Authenticated Shopify Admin client
 * @param cappedAmount - Subscription capped amount in USD
 * @param balanceUsedAmount - Current balance used in USD
 * @param totalAmount - Total usage amount calculated
 * @param usageLineItemId - Shopify usage line item ID
 * @returns Actual amount billed (might be capped)
 */
export async function applyUsageCharge(
  admin: authenticateAdmin,
  cappedAmount: number,
  balanceUsedAmount: number,
  totalAmount: number,
  usageLineItemId: string,
): Promise<number> {
  const description = "Billing for order items customized via FastEditor";

  if (balanceUsedAmount + totalAmount > cappedAmount) {
    const availablePrice = cappedAmount - balanceUsedAmount

    const price = {
      amount: availablePrice,
      currencyCode: "USD"
    };

    await createAppUsageRecord(admin, description, price, usageLineItemId);
    await setAppAvailabilityMetafield(admin, "false")

    return availablePrice
  }

  const price = {
    amount: totalAmount,
    currencyCode: "EUR"
  };

  await createAppUsageRecord(admin, description, price, usageLineItemId);

  return totalAmount
}

/**
 * Retrieves all shops with FastEditor activity in the past month.
 *
 * @returns Array of shops
 */
async function getShopsWithActivity(): Promise<Shop[]> {
  const since = getOneMonthAgoDate();
  const shops = await findShopsWithFastEditorOrderItemsLastMonth(since);

  if (shops.length === 0) {
    console.info(`[${ENDPOINT}] No shops found with FastEditor activity in the last month`);
  }

  return shops;
}

/**
 * Calculates the total usage fee for a list of unbilled items.
 *
 * @param items - Array of unbilled items
 * @returns Total usage amount
 */
export function calculateTotalUsageFee(items: UnbilledOrderItem[]): number {
  return items.reduce((sum, item) => sum + item.usageFee, 0);
}


/**
 * Marks all unbilled items as billed.
 *
 * @param shop - The shop domain
 * @param sinceDate - Cutoff date for billing
 * @returns void
 */
async function markItemsAsBilled(shop: string, sinceDate: Date): Promise<void> {
  const resultCount = await updateUnbilledFastEditorOrderItemsLastMonth(shop, sinceDate);
  console.info(`[${ENDPOINT}] Marked ${resultCount} customized items as billed for shop: ${shop}`);
}

/**
 * Saves usage billing history in the database.
 *
 * @param shop - The shop domain
 * @param amount - Amount billed
 * @param itemCount - Number of billed items
 * @returns void
 */
async function recordBillingHistory(shop: string, amount: number, itemCount: number): Promise<void> {
  const history = await createUsageBillingHistoryForShop(shop, amount, itemCount);
  console.info(`[${ENDPOINT}] Created usage billing history record`, history);
}

/**
 * Returns a Date object representing exactly one month ago from today.
 *
 * @returns Date object
 */
export function getOneMonthAgoDate(): Date {
  const date = new Date();
  date.setMonth(date.getMonth() - 1);
  return date;
}
