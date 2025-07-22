import type {ActionFunctionArgs, LoaderFunctionArgs} from "@remix-run/node";
import {
  fetchProductDataFromFastEditor,
  extractFastEditorUrlFromRequest,
  validateProductData
} from "../services/fasteditorProduct.server";
import {actionMethodNotAllowed, errorResponse} from "../services/app.server";

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
    return new Response(JSON.stringify({
      message: "Product data fetched successfully.",
      data: {
        variantId: product.customAttributes.variantId,
        quantity: product.quantity,
        projectKey: product.projectKey,
      },
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      }
    });
  } catch (error) {
    return await errorResponse(error, ENDPOINT, "Failed to resolve product")
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
