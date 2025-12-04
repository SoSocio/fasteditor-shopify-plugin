import type {ActionFunctionArgs, LoaderFunctionArgs} from "@remix-run/node";
import {
  actionMethodNotAllowed,
  loaderMethodNotAllowed
} from "../services/app.server";
import {
  parseAndValidateRequest,
  fetchShopSettings,
  fetchProductSKU,
  buildFastEditorPayload
} from "../services/smartlink.server";
import {FastEditorAPI} from "../services/fastEditorAPI.server";
import type {FastEditorIntegrationData} from "../types/fastEditor.types";

const ENDPOINT = "/app/smartlink";

/**
 * GET requests are not allowed on this endpoint.
 */
export const loader = async ({request}: LoaderFunctionArgs): Promise<void> => {
  loaderMethodNotAllowed({request, endpoint: ENDPOINT});
};

/**
 * Handles POST requests to create a SmartLink via FastEditor.
 */
export const action = async ({request}: ActionFunctionArgs): Promise<Response> => {
  actionMethodNotAllowed({request, allowedMethods: ["POST"], endpoint: ENDPOINT});

  console.info(`[${ENDPOINT}] SmartLink creation request received`);

  try {
    // Parse and validate request
    const requestData = await parseAndValidateRequest(request);

    // Fetch required data
    const shopSettings = await fetchShopSettings(requestData.shop);
    const variantSKU = await fetchProductSKU(requestData.variantId, requestData.shop);
    const cartUrl = `https://${requestData.shop}/products/${requestData.productHandle}`;

    // Build FastEditor payload
    const fastEditorParams = buildFastEditorPayload({
      ...shopSettings,
      variantId: requestData.variantId,
      quantity: requestData.quantity,
      variantSKU,
      cartUrl,
      userId: requestData.userId,
    });

    // Create SmartLink via FastEditor API
    let response: FastEditorIntegrationData;
    try {
      const fastEditorAPI = new FastEditorAPI(shopSettings.fastEditorApiKey, shopSettings.fastEditorDomain);
      response = await fastEditorAPI.createSmartLink(fastEditorParams);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[${ENDPOINT}] FastEditor API error:`, errorMessage);

      // Check if it's a FastEditor API error (contains "FastEditor" in message)
      if (errorMessage.includes("FastEditor")) {
        return new Response(
          JSON.stringify({
            statusCode: 502,
            statusText: "FastEditor API error",
            message: errorMessage,
            code: "FASTEDITOR_API_ERROR",
            ok: false,
          }),
          {
            status: 502,
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      }

      // Re-throw to be handled by outer catch
      throw error;
    }

    console.info(`[${ENDPOINT}] SmartLink created successfully for shop: ${requestData.shop}, variantId: ${requestData.variantId}`);

    // Return structured success response
    return new Response(
      JSON.stringify({
        statusCode: 200,
        statusText: "success",
        data: {url: response.URL},
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
        message: "An unexpected error occurred while creating SmartLink.",
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
