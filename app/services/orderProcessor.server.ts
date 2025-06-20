import { getFastEditorAPIForShop } from './fastEditorFactory.server';
import { ShopifyAPI } from './shopifyAPI.server';

/**
 * Interface for FastEditor design data from line item properties.
 */
interface FastEditorDesignData {
  offering_id: string;
  image_url?: string;
  svg_url?: string;
  metadata?: any;
}

/**
 * Service for processing orders and handling FastEditor integration.
 */
export class OrderProcessor {
  private shopifyAPI: ShopifyAPI;
  private fastEditorAPI: any;

  constructor(shopifyAPI: ShopifyAPI, fastEditorAPI: any) {
    this.shopifyAPI = shopifyAPI;
    this.fastEditorAPI = fastEditorAPI;
  }

  /**
   * Creates an OrderProcessor instance for a specific shop.
   * @param shop - The shop domain.
   * @returns OrderProcessor instance configured for the shop.
   */
  static async forShop(shop: string): Promise<OrderProcessor> {
    const shopifyAPI = await ShopifyAPI.forShop(shop);
    const fastEditorAPI = await getFastEditorAPIForShop(shop);
    return new OrderProcessor(shopifyAPI, fastEditorAPI);
  }

  /**
   * Processes a paid order and sends custom items to FastEditor.
   * @param order - The Shopify order object.
   * @param shop - The shop domain.
   * @returns Array of processing results for each custom item.
   */
  async processPaidOrder(order: any, shop: string): Promise<any[]> {
    const customItems = this.extractCustomItems(order);
    
    if (customItems.length === 0) {
      console.log(`No custom items found in order ${order.name}`);
      return [];
    }

    const results = [];
    const callbackUrl = `${process.env.SHOPIFY_APP_URL}/webhooks/fasteditor-sale-result?shop=${encodeURIComponent(shop)}`;

    for (const item of customItems) {
      try {
        const result = await this.processCustomItem(item, order, callbackUrl, shop);
        results.push({
          success: true,
          lineItemId: item.id,
          offeringId: item.designData.offering_id,
          result
        });
      } catch (error) {
        console.error(`Failed to process custom item ${item.id}:`, error);
        results.push({
          success: false,
          lineItemId: item.id,
          offeringId: item.designData?.offering_id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Update order tags to indicate processing
    await this.updateOrderProcessingStatus(order.id, results);

    return results;
  }

  /**
   * Extracts custom items from order line items.
   * @param order - The Shopify order object.
   * @returns Array of custom line items with design data.
   */
  private extractCustomItems(order: any): Array<any & { designData: FastEditorDesignData }> {
    const customItems = [];

    for (const lineItem of order.line_items) {
      const designData = this.extractDesignDataFromLineItem(lineItem);
      
      if (designData) {
        customItems.push({
          ...lineItem,
          designData
        });
      }
    }

    return customItems;
  }

  /**
   * Extracts FastEditor design data from line item properties.
   * @param lineItem - The Shopify line item.
   * @returns FastEditor design data or null if not found.
   */
  private extractDesignDataFromLineItem(lineItem: any): FastEditorDesignData | null {
    // Check line item properties for FastEditor data
    if (lineItem.properties) {
      for (const prop of lineItem.properties) {
        if (prop.name === 'fasteditor_design_data' && prop.value) {
          try {
            return JSON.parse(prop.value);
          } catch (error) {
            console.error('Failed to parse FastEditor design data:', error);
          }
        }
      }
    }

    // Check for offering_id in properties
    let offeringId = null;
    if (lineItem.properties) {
      for (const prop of lineItem.properties) {
        if (prop.name === 'offering_id' || prop.name === 'fasteditor_offering_id') {
          offeringId = prop.value;
          break;
        }
      }
    }

    if (offeringId) {
      return {
        offering_id: offeringId,
        metadata: this.extractMetadataFromLineItem(lineItem)
      };
    }

    return null;
  }

  /**
   * Extracts metadata from line item properties.
   * @param lineItem - The Shopify line item.
   * @returns Metadata object.
   */
  private extractMetadataFromLineItem(lineItem: any): any {
    const metadata: any = {};

    if (lineItem.properties) {
      for (const prop of lineItem.properties) {
        if (prop.name.startsWith('fasteditor_') && prop.name !== 'fasteditor_design_data') {
          const key = prop.name.replace('fasteditor_', '');
          metadata[key] = prop.value;
        }
      }
    }

    return metadata;
  }

  /**
   * Processes a single custom item by sending it to FastEditor.
   * @param item - The custom line item with design data.
   * @param order - The Shopify order object.
   * @param callbackUrl - The callback URL for FastEditor.
   * @param shop - The shop domain.
   * @returns FastEditor API response.
   */
  private async processCustomItem(
    item: any & { designData: FastEditorDesignData },
    order: any,
    callbackUrl: string,
    shop: string
  ): Promise<any> {
    const payload = {
      offering_id: item.designData.offering_id,
      order_id: order.name, // Using order name as order_id
      order_item_id: item.id.toString(),
      design_data: {
        image_url: item.designData.image_url,
        svg_url: item.designData.svg_url,
        metadata: {
          ...item.designData.metadata,
          shop: shop, // Include shop information in metadata
          order_name: order.name
        }
      },
      customer: {
        email: order.email,
        name: `${order.billing_address?.first_name || ''} ${order.billing_address?.last_name || ''}`.trim()
      },
      shipping_address: order.shipping_address ? {
        first_name: order.shipping_address.first_name,
        last_name: order.shipping_address.last_name,
        address1: order.shipping_address.address1,
        address2: order.shipping_address.address2,
        city: order.shipping_address.city,
        province: order.shipping_address.province,
        country: order.shipping_address.country,
        zip: order.shipping_address.zip,
        phone: order.shipping_address.phone
      } : undefined,
      callback_url: callbackUrl
    };

    return await this.fastEditorAPI.sendSaleNotification(payload);
  }

  /**
   * Updates order processing status with tags and metafields.
   * @param orderId - The Shopify order ID.
   * @param results - Array of processing results.
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
        value: JSON.stringify(results)
      });

    } catch (error) {
      console.error('Failed to update order processing status:', error);
    }
  }
} 