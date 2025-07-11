import {
  findUnbilledFastEditorOrderItemsLastMonth,
  updateUnbilledFastEditorOrderItemsLastMonth
} from "../models/fastEditorOrderItems.server";
import type {authenticate} from "../shopify.server";
import {billingCheck, billingCreateUsageRecord} from "./billing.server";
import {createUsageBillingHistoryForShop} from "../models/usageBillingHistory";

/**
 * Function to get the date exactly one month ago from now.
 * @returns Date object representing one month ago.
 */
export function getOneMonthAgoDate(): Date {
  const date = new Date();
  date.setMonth(date.getMonth() - 1);
  return date;
}


/**
 * Handles usage-based billing for a specific shop.
 *
 * @param shop - The shop's domain.
 * @param date - Date since when to look for unbilled items.
 * @param endpoint - Logger label to identify which process called the billing.
 * @param billing - The billing object provided by `authenticate.admin`.
 */
export async function handleShopBilling(
  shop: string,
  date: Date,
  endpoint: string,
  billing: Awaited<ReturnType<typeof authenticate.admin>>["billing"],
): Promise<void> {
  const unbilledItems = await findUnbilledFastEditorOrderItemsLastMonth(shop, date)

  if (!unbilledItems.length) {
    console.info(`[${endpoint}] No unbilled items for shop: ${shop}`);
    return;
  }

  const totalUsageFee: number = unbilledItems.reduce(
    (sum: number, item: { usageFee: number }) => sum + item.usageFee,
    0
  );

  if (totalUsageFee <= 0) {
    console.info(`[${endpoint}] Total usage fee is 0 for shop: ${shop}`);
    return;
  }

  const {hasActivePayment} = await billingCheck(billing);
  if (!hasActivePayment) {
    console.warn(`[${endpoint}] No active subscription for shop: ${shop}`);
    return;
  }

  const description = "Billing for customized FastEditor items";
  const price = {
    amount: totalUsageFee,
    currencyCode: "EUR",
  };

  const billingResult = await billingCreateUsageRecord(billing, description, price);
  console.info(`[${endpoint}] Created usage record for shop: ${shop}`, billingResult);

  const updateResult = await updateUnbilledFastEditorOrderItemsLastMonth(shop, date)
  console.info(`[${endpoint}] Updated ${updateResult.count} items as billed for shop: ${shop}`);

  const historyRecord = await createUsageBillingHistoryForShop(
    shop,
    totalUsageFee,
    updateResult.count
  );
  console.info(`[${endpoint}] Created usage billing history record:`, historyRecord);
}
