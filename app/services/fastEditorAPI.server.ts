/**
 * Service class for interacting with the FastEditor API.
 * Provides methods for product personalization, order notification, and more.
 */
export class FastEditorAPI {
  private apiKey: string;
  private domain: string;

  /**
   * Constructs a FastEditorAPI instance with the given API key and domain.
   * @param apiKey - The FastEditor API key for authentication.
   * @param domain - The FastEditor API domain (e.g., yourbrand.fasteditor.com).
   */
  constructor(apiKey: string, domain: string) {
    this.apiKey = apiKey;
    this.domain = domain;
  }

  /**
   * Creates a SmartLink for FastEditor product personalization.
   * @param params - Parameters for SmartLink creation, including SKU, userId,
   *   language, etc.
   * @returns The response from FastEditor API containing the editor URL.
   * @throws Error if the API request fails.
   */
  async createSmartLink(params: {
    userId?: string;
    sku: string;
    language?: string;
    country?: string;
    currency?: string;
    customAttributes?: object;
    productOptions?: {
      openOnStart: boolean;
      enabled: boolean;
    };
    projectId?: number;
    quantity?: number;
    cartUrl?: string;
  }): Promise<any> {
    // Prepare the request to FastEditor API
    const response = await fetch(`https://api.${this.domain}/api/smartlink`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': this.apiKey,
      },
      body: JSON.stringify(params),
    });

    // Check for unsuccessful response
    if (!response.ok) {
      throw new Error(`FastEditor createSmartLink failed: ${response.statusText}`);
    }

    // Return the parsed JSON response
    return response.json();
  }

  async checkShopIntegration() {
    const response = await fetch(`https://api.${this.domain}/api/smartlink`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': this.apiKey,
      },
    });

    // Check for unsuccessful response
    if (!response.ok) {
      throw new Error(`FastEditor checkShopIntegration failed: ${response.statusText}`);
    }

    // Return the parsed JSON response
    return response.json();
  }

  /**
   * Sends sale notification to FastEditor for order processing.
   * @param params - Sale notification parameters.
   * @returns The response from FastEditor API.
   * @throws Error if the API request fails.
   */
  async sendSaleNotification(params: {
    orderId?: string;
    orderItems: {
      projectKey: string;
      orderItemId: string;
      quantity: number;
      totalSaleValue?: number
    }[]
    billingInfo?: {
      name?: string;
      email?: string;
      address1?: string;
      address2?: string;
      city?: string;
      zip?: string;
      country?: string;
    }
    shippingInfo?: {
      name?: string;
      email?: string;
      address1?: string;
      address2?: string;
      city?: string;
      zip?: string;
      country?: string;
    }
    callbackUrl?: string;
  }): Promise<any> {
    const response = await fetch(`https://api.${this.domain}/webhook/notifyorder`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': this.apiKey,
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`FastEditor sale notification failed for order ${params.orderId}: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  /**
   * Downloads PDF file from FastEditor CDN.
   * @param downloadUrl - The URL to download the PDF from.
   * @returns The PDF file as a Buffer.
   * @throws Error if the download fails.
   */
  async downloadPDF(downloadUrl: string): Promise<Buffer> {
    const response = await fetch(downloadUrl);

    if (!response.ok) {
      throw new Error(`Failed to download PDF: ${response.statusText}`);
    }

    return Buffer.from(await response.arrayBuffer());
  }

  // Future methods can be added here, e.g.:
  // async notifyOrder(...) { ... }
  // async saleNotification(...) { ... }
}
