import {apiVersion, unauthenticated} from "../shopify.server";

interface ShopifySession {
  shop: string;
  accessToken: string;
}

/**
 * Service class for interacting with Shopify API.
 * Provides methods for order management, metafields, and more.
 */
export class ShopifyAPI {
  private session: ShopifySession;

  constructor(session: ShopifySession) {
    this.session = session;
  }

  private get shop() {
    return this.session.shop;
  }

  private get token() {
    return this.session.accessToken;
  }

  /**
   * Creates a ShopifyAPI instance for a specific shop session.
   * @param shop - The shop domain.
   * @returns ShopifyAPI instance configured for the shop.
   */
  static async forShop(shop: string): Promise<ShopifyAPI> {
    const {session} = await unauthenticated.admin(shop);
    if (!session?.accessToken || !session?.shop) {
      const message = "Missing access token or shop in unauthenticated session."
      console.error(message, session);
      throw new Error(message);
    }

    return new ShopifyAPI({
      shop: session.shop,
      accessToken: session.accessToken,
    });
  }

  /**
   * Retrieves order details from Shopify.
   * @param orderId - The Shopify order ID.
   * @returns Order details from Shopify API.
   */
  async getOrder(orderId: string): Promise<any> {
    const response = await fetch(`https://${this.shop}/admin/api/${apiVersion}/orders/${orderId}.json`, {
      headers: {
        'X-Shopify-Access-Token': this.token,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get order: ${response.statusText}`);
    }

    const data = await response.json();
    return data.order;
  }

  /**
   * Searches for an order by name (order number).
   * @param orderName - The order name/number to search for.
   * @returns Order details from Shopify API or null if not found.
   */
  async findOrderByName(orderName: string): Promise<any | null> {
    const response = await fetch(`https://${this.shop}/admin/api/${apiVersion}/orders.json?name=${encodeURIComponent(orderName)}&limit=1`, {
      headers: {
        'X-Shopify-Access-Token': this.token,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to search orders: ${response.statusText}`);
    }

    const data = await response.json();
    return data.orders.length > 0 ? data.orders[0] : null;
  }

  /**
   * Creates or updates a metafield for an order.
   * @param orderId - The Shopify order ID.
   * @param metafield - Metafield data including namespace, key, type, and value.
   * @returns The created/updated metafield.
   */
  async setOrderMetafield(orderId: string, metafield: {
    namespace: string;
    key: string;
    type: string;
    value: string;
  }): Promise<any> {
    const response = await fetch(`https://${this.shop}/admin/api/${apiVersion}/orders/${orderId}/metafields.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': this.token,
      },
      body: JSON.stringify({
        metafield: metafield
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to set order metafield: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.metafield;
  }

  /**
   * Gets metafields for an order.
   * @param orderId - The Shopify order ID.
   * @returns Array of metafields for the order.
   */
  async getOrderMetafields(orderId: string): Promise<any[]> {
    const response = await fetch(`https://${this.shop}/admin/api/${apiVersion}/orders/${orderId}/metafields.json`, {
      headers: {
        'X-Shopify-Access-Token': this.token,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get order metafields: ${response.statusText}`);
    }

    const data = await response.json();
    return data.metafields;
  }

  /**
   * Updates order tags.
   * @param orderId - The Shopify order ID.
   * @param tags - Array of tags to set for the order.
   * @returns Updated order.
   */
  async updateOrderTags(orderId: string, tags: string[]): Promise<any> {
    const response = await fetch(`https://${this.shop}/admin/api/${apiVersion}/orders/${orderId}.json`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': this.token,
      },
      body: JSON.stringify({
        order: {
          id: orderId,
          tags: tags.join(', ')
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to update order tags: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.order;
  }
}
