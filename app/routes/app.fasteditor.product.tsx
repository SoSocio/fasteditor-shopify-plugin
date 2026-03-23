import type {ActionFunctionArgs, LoaderFunctionArgs} from "@remix-run/node";
import {
  buildResolvedFastEditorProductData,
  fetchProductDataFromFastEditor,
  extractFastEditorUrlFromRequest,
  getExtraPagesCount,
  resolveExtraPricingForProduct,
  validateProductData
} from "../services/fasteditorProduct.server";
import {actionMethodNotAllowed} from "../services/app.server";

const ENDPOINT = "/app/fasteditor/product";

/**
 * Handles GET requests to resolve product data from FastEditor.
 */
export const loader = async ({request}: LoaderFunctionArgs): Promise<Response> => {
  console.info(`[${ENDPOINT}] Resolving FastEditor product...`);

  try {
    const paramUrl = extractFastEditorUrlFromRequest(request);
    const product = await fetchProductDataFromFastEditor(paramUrl);
    validateProductData(product);
    const resolvedPricing = await resolveExtraPricingForProduct(request, product);
    const resolvedData = buildResolvedFastEditorProductData(product, resolvedPricing);
    const extraPages = getExtraPagesCount(product);

    console.info(`[${ENDPOINT}] Product data fetched successfully.`, product);
    if (resolvedPricing?.extraPricing) {
      console.info(`[${ENDPOINT}] Extra pricing resolved successfully.`, {
        pricingMode: resolvedPricing.pricingMode,
        ...resolvedPricing.extraPricing,
      });
    } else if (extraPages > 0) {
      console.warn(
        `[${ENDPOINT}] Extra pages detected but no pricing rule matched.`,
        {
          variantId: product.customAttributes.variantId,
          extraPages,
        }
      );
    }

    return new Response(
      JSON.stringify({
        statusCode: 200,
        statusText: "success",
        data: resolvedData,
        ok: true,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    // If error is already a structured Response, return it as-is
    if (error instanceof Response) {
      return error;
    }

    // Handle unexpected errors
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[${ENDPOINT}] Unexpected error:`, errorMessage);

    return new Response(
      JSON.stringify({
        statusCode: 500,
        statusText: "Internal server error",
        message: "An unexpected error occurred while resolving product.",
        code: "INTERNAL_ERROR",
        ok: false,
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
};

/**
 * POST/PUT/DELETE requests are not allowed on this endpoint.
 */
export const action = async ({request}: ActionFunctionArgs): Promise<void> => {
  actionMethodNotAllowed({
    request,
    allowedMethods: [],
    endpoint: ENDPOINT,
  });
};
