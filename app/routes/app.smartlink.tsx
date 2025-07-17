import type {ActionFunctionArgs, LoaderFunctionArgs} from "@remix-run/node";
import {
  actionMethodNotAllowed,
  errorResponse,
  loaderMethodNotAllowed
} from "../services/app.server";
import {FastEditorAPI} from "../services/fastEditorAPI.server";
import {
  buildFastEditorPayload,
  fetchProductSKU,
  fetchShopSettings,
  parseAndValidateRequest
} from "../services/smartlink.server";
import type {FastEditorIntegrationData} from "../types/fastEditor.types";

const ENDPOINT = "/app/smartlink";

/**
 * GET requests are not allowed on this endpoint.
 */
export const loader = async ({request}: LoaderFunctionArgs): Promise<void> => {
  loaderMethodNotAllowed({request, endpoint: ENDPOINT})
};

/**
 * Handles POST requests to create a SmartLink via FastEditor.
 */
export const action = async ({request}: ActionFunctionArgs): Promise<Response> => {
  actionMethodNotAllowed({request, allowedMethods: ["POST"], endpoint: ENDPOINT});

  console.info(`[${ENDPOINT}] SmartLink POST request...`);

  try {
    const data = await parseAndValidateRequest(request);
    const shopSettings = await fetchShopSettings(data.shop);
    const variantSKU = await fetchProductSKU(data.variantId, data.shop);

    const cartUrl = `https://${data.shop}/products/${data.productHandle}`;
    const fastEditorParams = buildFastEditorPayload({
      ...shopSettings,
      ...data,
      variantSKU,
      cartUrl,
    });

    const fastEditor = new FastEditorAPI(shopSettings.fastEditorApiKey, shopSettings.fastEditorDomain);
    const response: FastEditorIntegrationData = await fastEditor.createSmartLink(fastEditorParams);

    console.info(`[${ENDPOINT}] SmartLink created successfully.`);
    return new Response(JSON.stringify({
      message: "SmartLink created successfully.",
      data: {url: response.URL},
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      }
    });

  } catch (error) {
    return await errorResponse(error, ENDPOINT, "Failed to create SmartLink")
  }
};
