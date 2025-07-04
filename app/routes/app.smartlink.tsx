import type {ActionFunctionArgs, LoaderFunctionArgs} from "@remix-run/node";
import {FastEditorAPI} from "../services/fastEditorAPI.server";
import prisma from "../db.server";
import {shopifyGraphqlRequest} from "../services/shopifyGraphqlRequest.server";
import {GET_PRODUCT_VARIANT_SKU} from "../graphql/query/getProductVariantSKU";
import {actionMethodNotAllowed} from "../errors/actionMethodNotAllowed";
import {loaderMethodNotAllowed} from "../errors/loaderMethodNotAllowed";

const ENDPOINT = "/app/smartlink";

type RequestData = {
  shop: string;
  variantId: string;
  productHandle: string;
  quantity: number;
};

type FastEditorResponse = {
  URL: string;
};

export const loader = async ({request}: LoaderFunctionArgs) => {
  loaderMethodNotAllowed({request, endpoint: ENDPOINT})
};

export const action = async ({request}: ActionFunctionArgs) => {
  actionMethodNotAllowed({request, allowedMethods: ["POST"], endpoint: ENDPOINT});

  try {
    const data: RequestData = await request.json();
    console.info(`[${ENDPOINT}] POST request. Payload:`, data);

    const {shop, variantId, productHandle, quantity} = data;

    if (!shop || !variantId || !productHandle || !quantity) {
      console.warn(`[${ENDPOINT}] Validation failed: Missing required fields.`);
      return Response.json(
        {
          ok: false,
          statusCode: 400,
          error: "BadRequest",
          message: "Fields 'shop', 'variantId', 'productHandle', and 'quantity' are required.",
        },
        {status: 400}
      );
    }

    const shopSettings = await prisma.shopSettings.findFirst({where: {shop}});

    if (!shopSettings) {
      console.warn(`[${ENDPOINT}] Shop settings not found for shop: ${shop}`);
      return Response.json(
        {
          ok: false,
          statusCode: 404,
          error: "NotFound",
          message: `Shop settings not found for shop: ${shop}`,
        },
        {status: 404}
      );
    }

    const {fastEditorApiKey, fastEditorDomain, id, language, country, currency} = shopSettings;

    if (!fastEditorApiKey || !fastEditorDomain) {
      console.error(`[${ENDPOINT}] Missing FastEditor credentials for shop: ${shop}`);
      throw new Error("FastEditor API key or domain not configured.");
    }

    const session = await prisma.session.findFirst({where: {shop}});
    if (!session) {
      console.warn(`[${ENDPOINT}] Session not found for shop: ${shop}`);
      return Response.json(
        {
          ok: false,
          statusCode: 404,
          error: "NotFound",
          message: `Session not found for shop: ${shop}`,
        },
        {status: 404}
      );
    }

    const productVariantData = await shopifyGraphqlRequest(session, GET_PRODUCT_VARIANT_SKU, {
      variables: {id: `gid://shopify/ProductVariant/${variantId}`},
    });

    const variantSKU = String(productVariantData?.productVariant?.sku);
    if (!variantSKU) {
      console.warn(`[${ENDPOINT}] SKU not found for variantId: ${variantId}`);
      return Response.json(
        {
          ok: false,
          statusCode: 404,
          error: "NotFound",
          message: "Product variant SKU not found.",
        },
        {status: 404}
      );
    }

    const cartUrl = `https://${shop}/products/${productHandle}`;
    const fastEditorParams = {
      userId: id ?? undefined,
      sku: variantSKU,
      language: language ?? undefined,
      country: country ?? undefined,
      currency: currency ?? undefined,
      customAttributes: {variantId},
      productOptions: {
        openOnStart: false,
        enabled: true,
      },
      quantity: quantity ?? undefined,
      cartUrl: cartUrl ?? undefined,
    };

    console.info(`[${ENDPOINT}] Calling FastEditor API with params:`, fastEditorParams);

    const fastEditor = new FastEditorAPI(fastEditorApiKey, fastEditorDomain);
    const response: FastEditorResponse = await fastEditor.createSmartLink(fastEditorParams);

    console.info(`[${ENDPOINT}] FastEditor API response:`, response);

    return Response.json(
      {
        ok: true,
        statusCode: 200,
        message: "SmartLink created successfully.",
        data: {url: response.URL},
      },
      {status: 200}
    );

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(`[${ENDPOINT}] Unexpected error:`, message);

    return Response.json(
      {
        ok: false,
        statusCode: 500,
        error: "InternalServerError",
        message: "Unexpected error occurred: " + message,
      },
      {
        status: 200
      }
    );
  }
};
