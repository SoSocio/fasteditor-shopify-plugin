import type {ActionFunctionArgs} from "@remix-run/node";
import {authenticate} from "../shopify.server";
import {OrderProcessor} from "../services/orderProcessor.server";
import type {ShopifyOrder} from "../types/order.types";

/**
 * Handles the `orders/paid` webhook from Shopify.
 *
 * Authenticates the incoming webhook request.
 * Processes customized items from FastEditor.
 * Saves customization data to the database.
 *
 * Returns HTTP 200 even on failure to avoid redundant retries by Shopify.
 */
export const action = async ({request}: ActionFunctionArgs): Promise<Response> => {
  const {admin, shop, topic, payload} = await authenticate.webhook(request);

  console.info(`[${topic}] Webhook received for shop: ${shop}`);

  if (!admin) {
    console.error(`[${topic}] Missing admin context for shop: ${shop}`);
    throw new Response("Admin context is missing", {status: 200});
  }

  if (!payload) {
    console.error(`[${topic}] Missing order data in webhook payload`);
    return new Response("No order data", {status: 200});
  }

  try {
    const order = payload as ShopifyOrder;
    console.info(`[${topic}] Processing order: ${order.name} for shop: ${shop}`);

    // Initialize order processor
    const orderProcessor = await OrderProcessor.forShop(shop);

    // Process FastEditor customizations in the order
    await orderProcessor.processPaidOrder(admin, order, shop);

    return new Response("OK", {status: 200});
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    console.error(`[${topic}] Failed to process order ${payload?.name} for shop ${shop}:`, message);

    // Return 200 to prevent Shopify retries, but log the failure for manual investigation
    return new Response("Error processed", {status: 200});
  }
};
