import type {
  SmartLinkPayload,
  SmartLinkRequestData,
  SmartLinkShopSettings
} from "../types/smartlink.types";
import {unauthenticated} from "../shopify.server";
import {getShopSettings} from "../models/shopSettings.server";
import {getProductVariantSku} from "./products.server";

const ENDPOINT = "/app/smartlink";

/**
 * Interface for structured error responses that can be consumed by extensions.
 */
export interface SmartLinkErrorResponse {
  statusCode: number;
  statusText: string;
  message: string;
  code?: string;
  ok: false;
}

/**
 * Interface for successful responses.
 */
export interface SmartLinkSuccessResponse {
  statusCode: number;
  statusText: string;
  data: {
    url: string;
  };
  ok: true;
}

/**
 * Creates a structured error response for extensions.
 */
function createErrorResponse(
  statusCode: number,
  message: string,
  code?: string
): SmartLinkErrorResponse {
  return {
    statusCode,
    statusText: message,
    message,
    ...(code && {code}),
    ok: false,
  };
}

/**
 * Parses and validates the incoming SmartLink request.
 *
 * @param request - The incoming HTTP request containing JSON with SmartLink data.
 * @returns Parsed and validated SmartLinkRequestData object.
 * @throws {Response} 400 - If any of the required fields are missing or invalid.
 */
export async function parseAndValidateRequest(request: Request): Promise<SmartLinkRequestData> {
  let data: unknown;

  try {
    data = await request.json();
  } catch (error) {
    console.warn(`[${ENDPOINT}] Invalid JSON in request body.`);
    const errorResponse = createErrorResponse(400, "Invalid JSON in request body.", "INVALID_JSON");
    throw new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: {"Content-Type": "application/json"},
    });
  }

  if (!data || typeof data !== 'object') {
    const errorResponse = createErrorResponse(400, "Request body must be a valid JSON object.", "INVALID_FORMAT");
    throw new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: {"Content-Type": "application/json"},
    });
  }

  const requestData = data as Partial<SmartLinkRequestData>;
  const {shop, variantId, productHandle, quantity, userId} = requestData;

  // Validate required fields
  if (!shop || (typeof shop === 'string' && !shop.trim())) {
    const errorResponse = createErrorResponse(400, "Field 'shop' is required and cannot be empty.", "MISSING_SHOP");
    throw new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: {"Content-Type": "application/json"},
    });
  }

  if (!variantId || (typeof variantId === 'string' && !variantId.trim())) {
    const errorResponse = createErrorResponse(400, "Field 'variantId' is required and cannot be empty.", "MISSING_VARIANT_ID");
    throw new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: {"Content-Type": "application/json"},
    });
  }

  if (!productHandle || (typeof productHandle === 'string' && !productHandle.trim())) {
    const errorResponse = createErrorResponse(400, "Field 'productHandle' is required and cannot be empty.", "MISSING_PRODUCT_HANDLE");
    throw new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: {"Content-Type": "application/json"},
    });
  }

  if (quantity === undefined || quantity === null) {
    const errorResponse = createErrorResponse(400, "Field 'quantity' is required.", "MISSING_QUANTITY");
    throw new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: {"Content-Type": "application/json"},
    });
  }

  const quantityNum = Number(quantity);
  if (isNaN(quantityNum) || !Number.isInteger(quantityNum) || quantityNum <= 0) {
    const errorResponse = createErrorResponse(400, `Invalid quantity. Must be a positive integer, got: ${quantity}`, "INVALID_QUANTITY");
    throw new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: {"Content-Type": "application/json"},
    });
  }

  return {
    shop: String(shop).trim(),
    variantId: String(variantId).trim(),
    productHandle: String(productHandle).trim(),
    quantity: quantityNum,
    userId: userId ? String(userId).trim() : undefined,
  };
}

/**
 * Fetches FastEditor-related configuration for the given shop.
 *
 * @param shop - The shop domain.
 * @returns An object containing the FastEditor configuration and shop metadata.
 * @throws {Response} 404 - If no settings found for the given shop.
 * @throws {Response} 500 - If FastEditor API key or domain are missing in settings.
 */
export async function fetchShopSettings(shop: string): Promise<SmartLinkShopSettings> {
  const settings = await getShopSettings(shop);

  if (!settings) {
    console.warn(`[${ENDPOINT}] Shop settings not found for shop: ${shop}`);
    const errorResponse = createErrorResponse(404, `Shop settings not found for shop: ${shop}`, "SHOP_SETTINGS_NOT_FOUND");
    throw new Response(JSON.stringify(errorResponse), {
      status: 404,
      headers: {"Content-Type": "application/json"},
    });
  }

  const {fastEditorApiKey, fastEditorDomain} = settings;

  if (!fastEditorApiKey || !fastEditorDomain) {
    console.error(`[${ENDPOINT}] FastEditor integration not configured for shop: ${shop}`);
    const errorResponse = createErrorResponse(
      500,
      "FastEditor API key or domain not configured. Please configure FastEditor integration in settings.",
      "FASTEDITOR_NOT_CONFIGURED"
    );
    throw new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: {"Content-Type": "application/json"},
    });
  }

  return {
    language: settings.language ?? "",
    country: settings.country ?? "",
    currency: settings.currency ?? "",
    fastEditorApiKey,
    fastEditorDomain,
  };
}

/**
 * Retrieves the SKU for a specific product variant.
 *
 * @param variantId - The numeric ID of the product variant.
 * @param shop - The shop domain.
 * @returns The variant SKU as a string.
 * @throws {Response} 404 - If the variant or SKU is not found.
 * @throws {Response} 500 - If there's an error fetching the variant data.
 */
export async function fetchProductSKU(variantId: string, shop: string): Promise<string> {
  try {
    const {admin} = await unauthenticated.admin(shop);
    const sku = await getProductVariantSku(admin, variantId);

    if (!sku || sku.trim().length === 0) {
      console.warn(`[${ENDPOINT}] Product variant SKU not found for variantId: ${variantId}, shop: ${shop}`);
      const errorResponse = createErrorResponse(404, `Product variant SKU not found for variant ID: ${variantId}`, "VARIANT_SKU_NOT_FOUND");
      throw new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: {"Content-Type": "application/json"},
      });
    }

    return sku.trim();
  } catch (error) {
    if (error instanceof Response) {
      throw error;
    }
    console.error(`[${ENDPOINT}] Error fetching product SKU for variantId: ${variantId}, shop: ${shop}`, error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorResponse = createErrorResponse(500, `Failed to fetch product variant SKU: ${errorMessage}`, "SKU_FETCH_ERROR");
    throw new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: {"Content-Type": "application/json"},
    });
  }
}

/**
 * Constructs a payload to send to the FastEditor customization interface.
 *
 * @param payload - SmartLink payload containing shop and product details.
 * @returns Formatted FastEditor payload compatible with the API.
 */
export function buildFastEditorPayload({
  language,
  country,
  currency,
  variantId,
  quantity,
  variantSKU,
  cartUrl,
  userId,
}: SmartLinkPayload) {
  return {
    ...(userId && {userId}),
    sku: variantSKU,
    ...(language && {language}),
    ...(country && {country}),
    ...(currency && {currency}),
    customAttributes: {
      variantId,
    },
    productOptions: {
      openOnStart: false,
      enabled: true,
    },
    quantity,
    cartUrl,
  };
}
