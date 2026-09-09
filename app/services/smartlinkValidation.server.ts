import type {SmartLinkRequestData} from "../types/smartlink.types";

const ENDPOINT = "/app/smartlink";

function createErrorResponse(
  statusCode: number,
  message: string,
  code?: string,
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
 * Parses the storefront payload. The shop is deliberately not read from the
 * payload because the verified App Proxy session is its only source of truth.
 */
export async function parseAndValidateRequest(
  request: Request,
): Promise<SmartLinkRequestData> {
  let data: unknown;

  try {
    data = await request.json();
  } catch {
    console.warn(`[${ENDPOINT}] Invalid JSON in request body.`);
    throw new Response(
      JSON.stringify(createErrorResponse(400, "Invalid JSON in request body.", "INVALID_JSON")),
      {status: 400, headers: {"Content-Type": "application/json"}},
    );
  }

  if (!data || typeof data !== "object") {
    throw new Response(
      JSON.stringify(createErrorResponse(400, "Request body must be a valid JSON object.", "INVALID_FORMAT")),
      {status: 400, headers: {"Content-Type": "application/json"}},
    );
  }

  const requestData = data as Partial<SmartLinkRequestData>;
  const {variantId, productHandle, quantity, userId} = requestData;

  if (!variantId || (typeof variantId === "string" && !variantId.trim())) {
    throw new Response(
      JSON.stringify(createErrorResponse(400, "Field 'variantId' is required and cannot be empty.", "MISSING_VARIANT_ID")),
      {status: 400, headers: {"Content-Type": "application/json"}},
    );
  }

  if (!productHandle || (typeof productHandle === "string" && !productHandle.trim())) {
    throw new Response(
      JSON.stringify(createErrorResponse(400, "Field 'productHandle' is required and cannot be empty.", "MISSING_PRODUCT_HANDLE")),
      {status: 400, headers: {"Content-Type": "application/json"}},
    );
  }

  if (quantity === undefined || quantity === null) {
    throw new Response(
      JSON.stringify(createErrorResponse(400, "Field 'quantity' is required.", "MISSING_QUANTITY")),
      {status: 400, headers: {"Content-Type": "application/json"}},
    );
  }

  const quantityNum = Number(quantity);
  if (Number.isNaN(quantityNum) || !Number.isInteger(quantityNum) || quantityNum <= 0) {
    throw new Response(
      JSON.stringify(createErrorResponse(400, `Invalid quantity. Must be a positive integer, got: ${quantity}`, "INVALID_QUANTITY")),
      {status: 400, headers: {"Content-Type": "application/json"}},
    );
  }

  return {
    variantId: String(variantId).trim(),
    productHandle: String(productHandle).trim(),
    quantity: quantityNum,
    userId: userId ? String(userId).trim() : undefined,
  };
}
