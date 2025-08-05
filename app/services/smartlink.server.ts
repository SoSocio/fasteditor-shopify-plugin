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
 * Parses and validates the incoming SmartLink request.
 *
 * @param request - The incoming HTTP request containing JSON with SmartLink data.
 * @returns Parsed and validated SmartLinkRequestData object.
 * @throws {Response} 400 - If any of the required fields are missing or invalid.
 */
export async function parseAndValidateRequest(request: Request): Promise<SmartLinkRequestData> {
  const data: SmartLinkRequestData = await request.json();
  const {shop, variantId, productHandle, quantity} = data;

  if (!shop || !variantId || !productHandle || !quantity) {
    console.warn(`[${ENDPOINT}] Validation failed: Missing required fields.`);
    throw new Response("Fields 'shop', 'variantId', 'productHandle', and 'quantity' are required.", {status: 400});
  }

  return {shop, variantId, productHandle, quantity};
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
    throw new Response(`Shop settings not found for shop: ${shop}`, {status: 404});
  }

  const {fastEditorApiKey, fastEditorDomain} = settings;
  if (!fastEditorApiKey || !fastEditorDomain) {
    throw new Response("FastEditor API key or domain not configured.", {status: 500});
  }

  return {
    id: settings.id ?? "",
    language: settings.language ?? "",
    country: settings.country ?? "",
    currency: settings.currency ?? "",
    fastEditorApiKey: settings.fastEditorApiKey ?? "",
    fastEditorDomain: settings.fastEditorDomain ?? "",
  };
}


/**
 * Retrieves the SKU for a specific product variant.
 *
 * @param variantId - The numeric ID of the product variant.
 * @param shop - The shop domain.
 * @returns The variant SKU as a string.
 * @throws {Response} 404 - If the SKU is not found.
 */
export async function fetchProductSKU(variantId: string, shop: string): Promise<string> {
  const {admin} = await unauthenticated.admin(shop);
  const sku = await getProductVariantSku(admin, variantId);

  if (!sku) {
    throw new Response("Product variant SKU not found.", {status: 404});
  }

  return String(sku);
}

/**
 * Constructs a payload to send to the FastEditor customization interface.
 *
 * @param payload - SmartLink payload containing shop and product details.
 * @returns Formatted FastEditor payload compatible with the API.
 */
export function buildFastEditorPayload(
  {
    id,
    language,
    country,
    currency,
    variantId,
    quantity,
    variantSKU,
    cartUrl,
  }: SmartLinkPayload) {
  return {
    userId: id,
    sku: variantSKU,
    language,
    country,
    currency,
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
