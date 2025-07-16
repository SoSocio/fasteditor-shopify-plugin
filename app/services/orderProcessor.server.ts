import {getFastEditorAPIForShop} from "./fastEditorFactory.server";
import {ShopifyAPI} from "./shopifyAPI.server";
import type {ShopifyLineItem, ShopifyOrder} from "../types/shopify";
import {
  createFastEditorOrderItem,
  fastEditorOrderItemExists
} from "../models/fastEditorOrderItems.server";
import {FEE_RATE, MIN_FEE_EUR} from "../constants";
import {convertToEUR} from "./currency.server";

interface FastEditorOrderItem {
  projectKey: string;
  orderItemId: string;
  quantity: number;
  totalSaleValue: number;
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
   * @param order - Shopify order object.
   * @param shop - The shop domain.
   * @returns An array of results for each processed group of customized items.
   */
  async processPaidOrder(order: ShopifyOrder, shop: string): Promise<any[]> {
    const customItems = this.extractCustomLineItems(order.line_items, order.name);
    console.log("processPaidOrder customItems:", customItems);
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
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }

    // Update order tags and metafields to reflect processing status
    await this.updateOrderProcessingStatus(order.id, results);

    // Persist customized items to the database
    const savedItems = await this.addCustomItemsToDatabase(shop, order, customItems);
    console.log(`Saved ${savedItems.length} customized items to DB`);

    return results;
  }

  /**
   * Adds customized FastEditor items to the database if they don't exist yet.
   * @param shop - The shop domain.
   * @param order - Shopify order.
   * @param customItems - Customized line items.
   * @returns Array of inserted FastEditor items.
   */
  async addCustomItemsToDatabase(shop: string, order: ShopifyOrder, customItems: ShopifyLineItem[]): Promise<any[]> {
    const insertedItems: any[] = [];

    for (const item of customItems) {
      const projectKey = this.extractProjectKeyFromItem(item);
      const orderId = String(order.id);
      const lineItemId = String(item.id);

      const exists = await fastEditorOrderItemExists(shop, orderId, lineItemId);
      if (exists) {
        console.log(`Line item ${lineItemId} for shop ${shop} already exists. Skipping.`);
        continue;
      }

      const usageFee = await this.calculateItemUsageFee(
        order.currency,
        parseFloat(item.price),
        item.quantity
      )

      const created = await createFastEditorOrderItem(shop, order, item, projectKey, usageFee)
      insertedItems.push(created);
    }

    return insertedItems;
  }

  /**
   * Calculates usage fee for a customized line item, converted to EUR.
   * @param currency - The original currency code of the item price.
   * @param unitPrice - The price of a single item (in original currency).
   * @param quantity - Number of items ordered.
   * @returns Calculated fee in EUR, rounded to 2 decimal places.
   */
  private async calculateItemUsageFee(
    currency: string,
    unitPrice: number,
    quantity: number
  ): Promise<number> {
    const priceInEUR = await convertToEUR(currency, unitPrice);
    console.log(`priceInEUR: ${priceInEUR}`);
    const feePerItem = Math.max(priceInEUR * FEE_RATE, MIN_FEE_EUR);
    console.log(`feePerItem: ${feePerItem}`);
    const totalFee = feePerItem * quantity;
    console.log(`totalFee: ${totalFee}`);
    return parseFloat(totalFee.toFixed(2));
  }

  /**
   * Extracts line items that were customized using FastEditor.
   * @param lineItems - Array of Shopify line items.
   * @param orderName - Name of the Shopify order (for logging).
   * @returns Array of line items customized via FastEditor.
   */
  private extractCustomLineItems(lineItems: ShopifyLineItem[], orderName: string): ShopifyLineItem[] {
    const items = lineItems.filter((item) =>
      item.properties?.some((prop) => prop.name === "_fasteditor_project_key"),
    );

    if (items.length === 0) {
      console.log(`No FastEditor custom items found in order ${orderName}`);
    }

    return items;
  }

  /**
   * Maps Shopify line items to FastEditor API format.
   * @param items - Customized line items.
   * @returns Array of FastEditorOrderItem.
   */
  private mapToFastEditorOrderItems(items: ShopifyLineItem[]): FastEditorOrderItem[] {
    return items.map((item) => {
      const projectKey = this.extractProjectKeyFromItem(item);

      return {
        projectKey,
        orderItemId: item.id.toString(),
        quantity: item.quantity,
        totalSaleValue: parseFloat(item.price),
      };
    });
  }

  /**
   * Extracts `_fasteditor_project_key` from a Shopify line item.
   * @param item - Shopify line item.
   * @returns The project key as string.
   * @throws Error if the key is missing.
   */
  private extractProjectKeyFromItem(item: ShopifyLineItem): string {
    const projectKeyProp = item.properties?.find((p) => p.name === "_fasteditor_project_key");
    const projectKey = projectKeyProp?.value ?? "";

    if (!projectKey) {
      throw new Error(`Item ${item.id} is missing _fasteditor_project_key value`);
    }

    return projectKey;
  }

  /**
   * Sends customized item data to FastEditor API.
   * @param order - Original Shopify order.
   * @param orderItems - Array of customized items to send.
   * @param callbackUrl - URL for FastEditor result webhook.
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
        email: order.customer?.email || "",
        address1: order.billing_address.address1,
        address2: order.billing_address.address2 || "",
        city: order.billing_address.city,
        zip: order.billing_address.zip,
        country: order.billing_address.country,
      },
      shippingInfo: {
        name: order.shipping_address.name,
        email: order.customer?.email || "",
        address1: order.shipping_address.address1,
        address2: order.shipping_address.address2 || "",
        city: order.shipping_address.city,
        zip: order.shipping_address.zip,
        country: order.shipping_address.country,
      },
      callbackUrl
    };

    console.log("Sending FastEditor payload:", payload);
    return await this.fastEditorAPI.sendSaleNotification(payload);
  }

  /**
   * Updates tags and metafields in Shopify to reflect FastEditor processing result.
   * @param orderId - Shopify order ID.
   * @param results - Processing results.
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
        namespace: "fasteditor",
        key: "processing_results",
        type: "json",
        value: JSON.stringify(results),
      });

    } catch (error) {
      console.error(`Failed to update order ${orderId} processing metadata:`, error);
    }
  }
}
