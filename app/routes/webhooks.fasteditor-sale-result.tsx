import type { ActionFunctionArgs } from "@remix-run/node";
import { ShopifyAPI } from "../services/shopifyAPI.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    // Parse the FastEditor callback payload
    const body = await request.json();
    
    console.log('Received FastEditor sale result callback:', body);

    const {
      order_id,
      offering_id,
      order_item_id,
      status,
      message,
      download_url
    } = body;

    if (!order_id) {
      console.error('Missing order_id in FastEditor callback');
      return new Response('Missing order_id', { status: 400 });
    }

    // Extract shop from query parameters
    const url = new URL(request.url);
    const shop = url.searchParams.get('shop');

    if (!shop) {
      console.error('Missing shop parameter in callback URL');
      return new Response('Missing shop parameter', { status: 400 });
    }

    // Validate the callback (you might want to add signature verification here)
    if (status !== 'success') {
      console.error(`FastEditor processing failed for order ${order_id}: ${message}`);
      return new Response('Processing failed', { status: 200 });
    }

    // Create Shopify API instance
    const shopifyAPI = await ShopifyAPI.forShop(shop);

    // Try to find the order by order_id (which should be order.name from Shopify)
    // Since order_id is the order name, we need to search for it
    let order;
    try {
      // First try to get the order directly (in case order_id is actually the Shopify order ID)
      order = await shopifyAPI.getOrder(order_id);
    } catch (error) {
      // If that fails, try to search by order name
      try {
        order = await shopifyAPI.findOrderByName(order_id);
      } catch (searchError) {
        console.error(`Order ${order_id} not found in Shopify:`, searchError);
        return new Response('Order not found', { status: 404 });
      }
    }

    if (!order) {
      console.error(`Order ${order_id} not found in Shopify`);
      return new Response('Order not found', { status: 404 });
    }

    // Save the PDF download URL to order metafield
    await shopifyAPI.setOrderMetafield(order.id, {
      namespace: 'fasteditor',
      key: 'pdf_download_url',
      type: 'url',
      value: download_url
    });

    // Save additional metadata
    await shopifyAPI.setOrderMetafield(order.id, {
      namespace: 'fasteditor',
      key: 'processing_complete',
      type: 'boolean',
      value: 'true'
    });

    await shopifyAPI.setOrderMetafield(order.id, {
      namespace: 'fasteditor',
      key: 'completed_at',
      type: 'date_time',
      value: new Date().toISOString()
    });

    // Save offering_id and order_item_id for reference
    if (offering_id) {
      await shopifyAPI.setOrderMetafield(order.id, {
        namespace: 'fasteditor',
        key: 'offering_id',
        type: 'single_line_text_field',
        value: offering_id
      });
    }

    if (order_item_id) {
      await shopifyAPI.setOrderMetafield(order.id, {
        namespace: 'fasteditor',
        key: 'order_item_id',
        type: 'single_line_text_field',
        value: order_item_id
      });
    }

    // Update order tags to indicate completion
    const existingTags = order.tags ? order.tags.split(', ') : [];
    const updatedTags = existingTags.filter(tag => !tag.startsWith('fasteditor-'));
    updatedTags.push('fasteditor-complete');
    
    await shopifyAPI.updateOrderTags(order.id, updatedTags);

    console.log(`Successfully processed FastEditor result for order ${order_id}`);

    return new Response('OK', { status: 200 });

  } catch (error) {
    console.error('Error processing FastEditor sale result callback:', error);
    
    // Return 200 to acknowledge receipt
    return new Response('Error processed', { status: 200 });
  }
}; 