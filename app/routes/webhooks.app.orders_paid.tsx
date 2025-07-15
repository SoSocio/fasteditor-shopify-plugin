import type {ActionFunctionArgs} from "@remix-run/node";
import {authenticate} from "../shopify.server";
import {OrderProcessor} from "../services/orderProcessor.server";
import type {ShopifyOrder} from "../types/shopify";

/**
 * Webhook handler for `orders/paid` event.
 * Authenticates the webhook, processes customized items via FastEditor,
 * saves them to the database, and logs the result.
 */
export const action = async ({request}: ActionFunctionArgs): Promise<Response> => {
  const {shop, topic, payload} = await authenticate.webhook(request);

  console.log(`[${topic}] Webhook received for shop: ${shop}`);

  if (!payload) {
    console.error(`[${topic}] Missing order data in webhook payload`);
    return new Response("No order data", {status: 400});
  }

  try {
    const order = payload as ShopifyOrder;

    console.log(`[${topic}] Processing order ${order.name} for shop ${shop}`);

    // Create order processor and process the order
    const orderProcessor = await OrderProcessor.forShop(shop);

    // Process customized FastEditor items in the order
    const processingResults = await orderProcessor.processPaidOrder(order, shop);

    console.log(`[${topic}] Order ${order.name} processing complete`, {
      results: processingResults,
    });

    return new Response("OK", {status: 200});
  } catch (error) {
    console.error(`[${topic}] Failed to process order ${payload?.name} for ${shop}:`, error);

    // Return 200 to acknowledge receipt, but log the error
    // This prevents Shopify from retrying the webhook unnecessarily
    return new Response("Error processed", {status: 200});
  }
};
