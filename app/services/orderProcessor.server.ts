import {getFastEditorAPIForShop} from './fastEditorFactory.server';
import {ShopifyAPI} from './shopifyAPI.server';

interface FastEditorOrderItem {
  projectKey: string | number;
  orderItemId: string;
  quantity: number;
  totalSaleValue: number;
}

interface ShopifyLineItem {
  id: number;
  quantity: number;
  price: string;
  properties?: Array<{ name: string; value: string }>;
}

interface ShopifyOrder {
  id: string;
  name: string;
  line_items: ShopifyLineItem[];
  billing_address: Address;
  shipping_address: Address;
  customer: {
    email: string;
  };
}

interface Address {
  name: string;
  address1: string;
  address2?: string;
  city: string;
  zip: string;
  country: string;
}

/**
 * Service responsible for processing Shopify orders with items customized via FastEditor.
 */
export class OrderProcessor {
  private shopifyAPI: ShopifyAPI;
  private fastEditorAPI: any;

  constructor(shopifyAPI: ShopifyAPI, fastEditorAPI: any) {
    this.shopifyAPI = shopifyAPI;
    this.fastEditorAPI = fastEditorAPI;
  }

  /**
   * Creates a new OrderProcessor instance for a given shop.
   * @param shop - The shop domain.
   * @returns A configured OrderProcessor instance.
   */
  static async forShop(shop: string): Promise<OrderProcessor> {
    const shopifyAPI = await ShopifyAPI.forShop(shop);
    const fastEditorAPI = await getFastEditorAPIForShop(shop);
    return new OrderProcessor(shopifyAPI, fastEditorAPI);
  }

  /**
   * Processes a paid Shopify order by sending items customized through FastEditor.
   * Finds line items that were customized with FastEditor, prepares payload, and calls the API.
   * @param order - Shopify order object.
   * @param shop - The shop domain.
   * @returns An array of results for each processed group of customized items.
   */
  async processPaidOrder(order: any, shop: string): Promise<any[]> {
    const customItems = this.extractCustomLineItems(order.line_items);

    if (customItems.length === 0) {
      console.log(`No FastEditor custom items found in order ${order.name}`);
      return [];
    }

    const orderItems = this.mapToFastEditorOrderItems(customItems)
    const callbackUrl = `${process.env.SHOPIFY_APP_URL}/webhooks/fasteditor-sale-result?shop=${encodeURIComponent(shop)}`;
    const results: any[] = [];

    try {
      const response = await this.processCustomItem(order, orderItems, callbackUrl);
      results.push({success: true, items: customItems, response});
    } catch (error) {
      console.error(`FastEditor API error for order ${order.name}:`, error);
      results.push({
        success: false,
        items: customItems,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    // Update order tags and metafields to reflect processing status
    await this.updateOrderProcessingStatus(order.id, results);
    return results;
  }

  /**
   * Extracts line items that were customized using FastEditor.
   * Looks for a specific line item property `_fasteditor_project_key`.
   * @param lineItems - Array of Shopify line items.
   * @returns Array of line items customized via FastEditor.
   */
  private extractCustomLineItems(lineItems: ShopifyLineItem[]): ShopifyLineItem[] {
    return lineItems.filter(item =>
      item.properties?.some(prop => prop.name === '_fasteditor_project_key')
    );
  }

  /**
   * Maps Shopify line items to the format required by the FastEditor API.
   * @param items - Line items that were customized via FastEditor.
   * @returns Array of formatted FastEditor order items.
   */
  private mapToFastEditorOrderItems(items: ShopifyLineItem[]): FastEditorOrderItem[] {
    return items.map((item) => {
      const projectKeyProp = item.properties?.find((p) => p.name === '_fasteditor_project_key');
      if (!projectKeyProp) {
        throw new Error(`Missing _fasteditor_project_key in item ${item.id}`);
      }

      return {
        projectKey: projectKeyProp.value,
        orderItemId: item.id.toString(),
        quantity: item.quantity,
        totalSaleValue: parseFloat(item.price),
      };
    });
  }

  /**
   * Sends customized item data to the FastEditor API for processing.
   * @param order - The original Shopify order.
   * @param orderItems - Array of customized items to send.
   * @param callbackUrl - URL FastEditor should use to report the result.
   * @returns Response from the FastEditor API.
   */
  private async processCustomItem(
    order: ShopifyOrder,
    orderItems: FastEditorOrderItem[],
    callbackUrl: string,
  ): Promise<any> {

    const payload = {
      orderId: order.name,
      orderItems,
      billingInfo: {
        name: order.billing_address.name,
        email: order.customer?.email || '',
        address1: order.billing_address.address1,
        address2: order.billing_address.address2 || '',
        city: order.billing_address.city,
        zip: order.billing_address.zip,
        country: order.billing_address.country,
      },
      shippingInfo: {
        name: order.shipping_address.name,
        email: order.customer?.email || '',
        address1: order.shipping_address.address1,
        address2: order.shipping_address.address2 || '',
        city: order.shipping_address.city,
        zip: order.shipping_address.zip,
        country: order.shipping_address.country,
      },
      callbackUrl
    };

    console.log('Sending FastEditor payload:', payload);
    return await this.fastEditorAPI.sendSaleNotification(payload);
  }

  /**
   * Updates order tags and metafields to reflect the result of FastEditor processing.
   * Adds a tag like `fasteditor-processing:2/3` and saves detailed results in a metafield.
   * @param orderId - Shopify order ID.
   * @param results - Array of processing results for the order.
   */
  private async updateOrderProcessingStatus(orderId: string, results: any[]): Promise<void> {
    try {
      const successCount = results.filter(r => r.success).length;
      const totalCount = results.length;

      // Update order tags
      const tags = [`fasteditor-processing:${successCount}/${totalCount}`];
      await this.shopifyAPI.updateOrderTags(orderId, tags);

      // Store processing results in metafield
      await this.shopifyAPI.setOrderMetafield(orderId, {
        namespace: 'fasteditor',
        key: 'processing_results',
        type: 'json',
        value: JSON.stringify(results),
      });

    } catch (error) {
      console.error(`Failed to update order ${orderId} processing metadata:`, error);
    }
  }
}
