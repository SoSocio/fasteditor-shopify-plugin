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
   * @param params - Parameters for SmartLink creation, including SKU, userId, language, etc.
   * @returns The response from FastEditor API containing the editor URL.
   * @throws Error if the API request fails.
   */
  async createSmartLink(params: {
    userId?: string;
    sku: string;
    language?: string;
    country?: string;
    currency?: string;
    custom_attributes?: object;
    productOptions?: object;
    openOnStart?: boolean;
    enabled?: boolean;
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
    const response = await fetch(`https://api.${this.domain}/api/shop-integration`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': this.apiKey,
      },
    });

    // Check for unsuccessful response
    if (!response.ok) {
      throw new Error(`FastEditor getProductsByUser failed: ${response.statusText}`);
    }

    // Return the parsed JSON response
    return response.json();
  }

  // Future methods can be added here, e.g.:
  // async notifyOrder(...) { ... }
  // async saleNotification(...) { ... }
}
