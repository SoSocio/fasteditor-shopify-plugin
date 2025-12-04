import type {ActionFunctionArgs, LoaderFunctionArgs} from "@remix-run/node";
import {
  fetchProductDataFromFastEditor,
  extractFastEditorUrlFromRequest,
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

    console.info(`[${ENDPOINT}] Product data fetched successfully.`);
    return new Response(
      JSON.stringify({
        statusCode: 200,
        statusText: "success",
        data: {
          variantId: product.customAttributes.variantId,
          quantity: product.quantity,
          projectKey: product.projectKey,
          imageUrl: product.imageUrl
        },
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
