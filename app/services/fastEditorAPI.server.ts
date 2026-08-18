import {getFastEditorApiBaseUrl} from "../utils/fastEditorDomain";
import type {FastEditorIntegrationData} from "../types/fastEditor.types";

function maskSecret(value: string): string {
  if (!value) {
    return "";
  }

  if (value.length <= 8) {
    return `${value.slice(0, 2)}***${value.slice(-2)}`;
  }

  return `${value.slice(0, 4)}***${value.slice(-4)}`;
}

function parseJsonResponse<T>(responseText: string): T | null {
  if (!responseText.trim()) {
    return null;
  }

  try {
    return JSON.parse(responseText) as T;
  } catch {
    return null;
  }
}

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
    const apiBaseUrl = getFastEditorApiBaseUrl(this.domain);

    // Prepare the request to FastEditor API
    const response = await fetch(`${apiBaseUrl}/api/smartlink`, {
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

  async checkShopIntegration(): Promise<FastEditorIntegrationData> {
    const apiBaseUrl = getFastEditorApiBaseUrl(this.domain);
    const requestUrl = `${apiBaseUrl}/api/smartlink`;
    const requestDetails = {
      method: "POST",
      url: requestUrl,
      domain: this.domain,
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": maskSecret(this.apiKey),
      },
      body: null,
    };

    console.info("[FastEditor checkShopIntegration] Request", requestDetails);

    const response = await fetch(requestUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': this.apiKey,
      },
    });
    const responseText = await response.text();
    const parsedResponse = parseJsonResponse<FastEditorIntegrationData>(responseText);

    console.info("[FastEditor checkShopIntegration] Response", {
      method: requestDetails.method,
      url: requestDetails.url,
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      contentType: response.headers.get("content-type"),
      body: parsedResponse ?? responseText,
    });

    // Check for unsuccessful response
    if (!response.ok) {
      throw new Error(
        `FastEditor checkShopIntegration failed: ${response.status} ${response.statusText}. Response: ${responseText}`
      );
    }

    if (!parsedResponse) {
      throw new Error(
        `FastEditor checkShopIntegration returned an empty or non-JSON response. Response: ${responseText}`
      );
    }

    return parsedResponse;
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
    const apiBaseUrl = getFastEditorApiBaseUrl(this.domain);
    const response = await fetch(`${apiBaseUrl}/webhook/notifyorder`, {
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
