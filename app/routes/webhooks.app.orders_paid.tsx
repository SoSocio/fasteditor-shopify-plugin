import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { OrderProcessor } from "../services/orderProcessor.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, topic, payload } = await authenticate.webhook(request);

  console.log(`Received ${topic} webhook for ${shop}`);

  try {
    const order = payload;

    if (!order) {
      console.error('No order data in webhook payload');
      return new Response('No order data', { status: 400 });
    }

    console.log(`Processing order ${order.name} for shop ${shop}`);

    // Create order processor and process the order
    const orderProcessor = await OrderProcessor.forShop(shop);
    const results = await orderProcessor.processPaidOrder(order, shop);

    console.log(`Order ${order.name} processed. Results:`, results);

    return new Response('OK', { status: 200 });

  } catch (error) {
    console.error(`Error processing order webhook for ${shop}:`, error);
    
    // Return 200 to acknowledge receipt, but log the error
    // This prevents Shopify from retrying the webhook unnecessarily
    return new Response('Error processed', { status: 200 });
  }
};
