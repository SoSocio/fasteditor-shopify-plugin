import {unauthenticated} from "../shopify.server";
import {resolvePricingRuleExtraCharge} from "./pricingRules.server";
import type {
  FastEditorResolvedProductData,
  ProductDataFromFastEditor
} from "../types/fastEditor.types";
import type {PricingRuleExtraCharge} from "../types/pricingRules.types";

const ENDPOINT = "app/fasteditor/product";

/**
 * Creates a structured error response for extensions.
 */
function createErrorResponse(
  statusCode: number,
  message: string,
  code?: string
) {
  return {
    statusCode,
    statusText: message,
    message,
    ...(code && {code}),
    ok: false,
  };
}

/**
 * Extracts and validates the `url` query parameter from the request.
 *
 * @param request - The incoming request object
 * @returns The trimmed FastEditor URL string
 * @throws Response with status 400 if the parameter is missing or empty
 */
export function extractFastEditorUrlFromRequest(request: Request): string {
  const requestUrl = new URL(request.url);
  const fastEditorUrl = requestUrl.searchParams.get("url");

  if (!fastEditorUrl || !fastEditorUrl.trim()) {
    console.warn(`[${ENDPOINT}] Missing or empty "url" query parameter`);
    const errorResponse = createErrorResponse(400, "Query parameter 'url' is required and must be non-empty.", "MISSING_URL_PARAMETER");
    throw new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: {"Content-Type": "application/json"},
    });
  }

  return fastEditorUrl.trim();
}

/**
 * Extracts shop domain from app proxy request.
 *
 * @param request - The incoming request object
 * @returns Shop domain or null when not available
 */
export function extractShopFromRequest(request: Request): string | null {
  const requestUrl = new URL(request.url);
  const shop = requestUrl.searchParams.get("shop")?.trim();

  return shop || null;
}

/**
 * Resolves the number of extra pages returned by FastEditor.
 *
 * @param product - Product data returned from FastEditor
 * @returns Non-negative integer count of extra pages
 */
export function getExtraPagesCount(product: ProductDataFromFastEditor): number {
  const parsed = Number(product.addOnQuantity ?? 0);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 0;
  }

  return Math.floor(parsed);
}

/**
 * Resolves pricing rule data for extra pages, if applicable.
 *
 * @param request - The incoming request object
 * @param product - Product data returned from FastEditor
 * @returns Extra pricing payload or null when no pricing rule applies
 */
export async function resolveExtraPricingForProduct(
  request: Request,
  product: ProductDataFromFastEditor
): Promise<PricingRuleExtraCharge | null> {
  const shop = extractShopFromRequest(request);
  const variantId = String(product.customAttributes?.variantId || "").trim();
  const extraPages = getExtraPagesCount(product);

  if (!shop || !variantId || extraPages <= 0) {
    return null;
  }

  const {admin} = await unauthenticated.admin(shop);

  return resolvePricingRuleExtraCharge(admin, variantId, extraPages, product.quantity);
}

/**
 * Maps FastEditor product data to the storefront response payload.
 *
 * @param product - Product data returned from FastEditor
 * @param extraPricing - Resolved extra pricing payload
 * @returns Response payload for storefront scripts
 */
export function buildResolvedFastEditorProductData(
  product: ProductDataFromFastEditor,
  extraPricing: PricingRuleExtraCharge | null
): FastEditorResolvedProductData {
  return {
    variantId: String(product.customAttributes.variantId || ""),
    quantity: product.quantity,
    projectKey: product.projectKey,
    imageUrl: product.imageUrl,
    customAttributes: product.customAttributes,
    pages: typeof product.pages === "number" ? product.pages : null,
    extraPages: getExtraPagesCount(product),
    addOnQuantity: typeof product.addOnQuantity === "number" ? product.addOnQuantity : null,
    price: typeof product.price === "number" ? product.price : null,
    currency: product.currency || null,
    extraPricing,
  };
}

/**
 * Fetches and parses product data from FastEditor by given URL.
 *
 * @param url - FastEditor API endpoint
 * @returns Parsed product data from FastEditor
 * @throws Response with appropriate HTTP status on failure
 */
export async function fetchProductDataFromFastEditor(
  url: string
): Promise<ProductDataFromFastEditor> {
  try {
    const rawData = await fetchRawFastEditorResponse(url);
    return parseFastEditorProduct(rawData);
  } catch (error) {
    console.error(`[${ENDPOINT}] Unexpected error while fetching product from FastEditor:`, error);

    if (error instanceof Response) {
      throw error;
    }

    const errorResponse = createErrorResponse(
      500,
      "Unexpected error occurred while fetching product from FastEditor.",
      "UNEXPECTED_ERROR"
    );
    throw new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: {"Content-Type": "application/json"},
    });
  }
}

/**
 * Sends GET request to the FastEditor URL and returns parsed JSON response.
 *
 * @param url - FastEditor API endpoint
 * @returns Raw JSON data returned from FastEditor
 * @throws Response with HTTP status from FastEditor if request fails
 */
export async function fetchRawFastEditorResponse(
  url: string
): Promise<unknown> {
  const response = await fetch(url, {method: "GET"})

  if (!response.ok) {
    console.warn(`[${ENDPOINT}] FastEditor request failed with status ${response.status}`);
    const errorResponse = createErrorResponse(
      response.status >= 500 ? 502 : response.status,
      "Failed to fetch product data from FastEditor.",
      "FASTEDITOR_FETCH_ERROR"
    );
    throw new Response(JSON.stringify(errorResponse), {
      status: response.status >= 500 ? 502 : response.status,
      headers: {"Content-Type": "application/json"},
    });
  }

  return response.json();
}

/**
 * Extracts and validates the first product object from FastEditor API response.
 *
 * @param data - Raw JSON data from FastEditor
 * @returns Single product object
 * @throws Response with status 422 if product data is missing or empty
 */
export function parseFastEditorProduct(
  data: any
): ProductDataFromFastEditor {
  const product = data?.[0];

  if (!product) {
    console.warn(`[${ENDPOINT}] FastEditor returned empty product array`);
    const errorResponse = createErrorResponse(422, "FastEditor returned empty product data.", "EMPTY_PRODUCT_DATA");
    throw new Response(JSON.stringify(errorResponse), {
      status: 422,
      headers: {"Content-Type": "application/json"},
    });
  }

  return product as ProductDataFromFastEditor;
}

/**
 * Validates required fields of the FastEditor product object.
 *
 * @param product - Product object from FastEditor
 * @throws Response with status 422 if required fields are missing
 */
export function validateProductData(product: ProductDataFromFastEditor): void {
  if (
    !product ||
    !product.projectKey ||
    !product.quantity ||
    !product.customAttributes?.variantId
  ) {
    console.warn(`[${ENDPOINT}] Product data missing required fields.`);
    const errorResponse = createErrorResponse(
      422,
      "Product data is missing required fields: 'projectKey', 'quantity', 'variantId'.",
      "MISSING_REQUIRED_FIELDS"
    );
    throw new Response(JSON.stringify(errorResponse), {
      status: 422,
      headers: {"Content-Type": "application/json"},
    });
  }
}
