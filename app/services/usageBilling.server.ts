import {
  findShopsWithFastEditorOrderItemsLastMonth,
  findUnbilledFastEditorOrderItemsLastMonth,
  updateUnbilledFastEditorOrderItemsLastMonth,
} from "../models/fastEditorOrderItems.server";

import {createAppUsageRecord} from "./billing.server";
import {getUsageAppSubscriptionLineItemId} from "./app.server";
import {createUsageBillingHistoryForShop} from "../models/usageBillingHistory";
import {unauthenticated} from "../shopify.server";
import type {unauthenticatedAdmin} from "../types/shopify";

const ENDPOINT = "cron/usage-billing";

interface Shop {
  shop: string;
}

interface UnbilledOrderItem {
  usageFee: number;
}

/**
 * Triggers usage billing for all shops with FastEditor activity in the last month.
 */
export async function processMonthlyUsageBilling(): Promise<void> {
  const activeShops = await getShopsWithActivity();

  for (const {shop} of activeShops) {
    const {admin} = await unauthenticated.admin(shop);
    await handleShopBilling(admin, shop);
  }
}

/**
 * Handles billing of FastEditor services for a specific shop.
 *
 * @param admin - Shopify Admin GraphQL client
 * @param shop - The shop's domain.
 */
export async function handleShopBilling(
  admin: unauthenticatedAdmin,
  shop: string,
): Promise<void> {
  const sinceDate = getOneMonthAgoDate();

  const subscriptionLineItemId = await getUsageAppSubscriptionLineItemId(admin);
  if (!subscriptionLineItemId) {
    console.warn(`[${ENDPOINT}] No active subscription for shop: ${shop}`);
    return;
  }

  const unbilledItems = await getUnbilledItems(shop, sinceDate);
  if (unbilledItems.length === 0) {
    console.info(`[${ENDPOINT}] No unbilled items for shop: ${shop}`);
    return;
  }

  const totalFee = calculateTotalUsageFee(unbilledItems);
  if (totalFee <= 0) {
    console.info(`[${ENDPOINT}] Total usage fee is 0 for shop: ${shop}`);
    return;
  }

  await billShop(admin, shop, totalFee, subscriptionLineItemId);
  await markItemsAsBilled(shop, sinceDate);
  await recordBillingHistory(shop, totalFee, unbilledItems.length);
}

/**
 * Retrieves all shops with FastEditor activity in the last month.
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
 * Retrieves all unbilled order items customized via FastEditor for a shop.
 *
 * @param shop - The shop's domain.
 * @param since - Date after which to look for customized items.
 */
async function getUnbilledItems(shop: string, since: Date): Promise<UnbilledOrderItem[]> {
  return await findUnbilledFastEditorOrderItemsLastMonth(shop, since);
}

/**
 * Calculates total usage fee for unbilled items.
 *
 * @param items - List of unbilled order items.
 */
export function calculateTotalUsageFee(items: UnbilledOrderItem[]): number {
  return items.reduce((sum, item) => sum + item.usageFee, 0);
}

/**
 * Creates a Shopify usage billing record.
 *
 * @param admin - Shopify Admin GraphQL client
 * @param shop - The shop's domain.
 * @param amount - Total fee to bill.
 * @param subscriptionLineItemId - The ID of the usage subscription line item
 */
async function billShop(
  admin: unauthenticatedAdmin,
  shop: string,
  amount: number,
  subscriptionLineItemId: string,
): Promise<void> {
  const description = "Billing for order items customized via FastEditor";
  const price = {
    amount,
    currencyCode: "EUR",
  };

  const result = await createAppUsageRecord(admin, description, price, subscriptionLineItemId);
  console.info(`[${ENDPOINT}] Created usage record for shop: ${shop}`, result);
}

/**
 * Updates all unbilled items as billed.
 *
 * @param shop - The shop's domain.
 * @param sinceDate - The cutoff date used to select items.
 */
async function markItemsAsBilled(shop: string, sinceDate: Date): Promise<void> {
  const result = await updateUnbilledFastEditorOrderItemsLastMonth(shop, sinceDate);
  console.info(`[${ENDPOINT}] Marked ${result.count} customized items as billed for shop: ${shop}`);
}

/**
 * Saves billing history in the database for audit purposes.
 *
 * @param shop - The shop's domain.
 * @param amount - Total billed amount.
 * @param itemCount -  Number of billed items.
 */
async function recordBillingHistory(shop: string, amount: number, itemCount: number): Promise<void> {
  const history = await createUsageBillingHistoryForShop(shop, amount, itemCount);
  console.info(`[${ENDPOINT}] Created usage billing history record`, history);
}

/**
 * Returns a Date object representing exactly one month ago from today.
 */
export function getOneMonthAgoDate(): Date {
  const date = new Date();
  date.setMonth(date.getMonth() - 1);
  return date;
}
