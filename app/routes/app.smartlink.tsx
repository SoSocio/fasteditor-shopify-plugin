import type {ActionFunctionArgs, LoaderFunctionArgs} from "@remix-run/node";
import {FastEditorAPI} from "../services/fastEditorAPI.server";
import prisma from "../db.server";

export const loader = async ({request}: LoaderFunctionArgs) => {
  console.error("GET request to /app/smartlink endpoint is not allowed.", request);
  return new Response(null, {status: 405, statusText: "Method Not Allowed"});
};

export const action = async ({request}: ActionFunctionArgs) => {
  if (request.method !== "POST") {
    console.error(`${request.method} request to /app/smartlink endpoint is not allowed.`, request);
    return new Response(null, {status: 405, statusText: "Method Not Allowed"});
  }
  try {
    const data = await request.json();
    const shop = data.shop;
    console.log("POST request to /app/smartlink endpoint. Payload: ", data);

    const {fastEditorApiKey, fastEditorDomain, id, language, country, currency} = await prisma.shopSettings.findFirst({
      where: {shop: shop}
    });

    if (!fastEditorApiKey) {
      throw new Error("Not found fastEditorApiKey");
    }

    if (!fastEditorDomain) {
      throw new Error("Not found fastEditorDomain");
    }

    const fastEditor = new FastEditorAPI(fastEditorApiKey, fastEditorDomain);

    if (!data.sku) {
      return Response.json(
        {
          statusCode: 400,
          statusText: 'Missing SKU',
          ok: false
        },
        {
          status: 200
        }
      );
    }

    const cartUrl = `https://${shop}/cart`;
    const openProductOptionsOnStart = false;
    const productOptionsEnabled = true;

    const params = {
      userId: id,
      sku: data.sku,
      language: language,
      country: country,
      currency: currency,
      custom_attributes: data?.custom_attributes ?? [],
      productOptions: {
        openOnStart: openProductOptionsOnStart,
        enabled: productOptionsEnabled,
      },
      quantity: data?.quantity ?? null,
      cartUrl: cartUrl
    }

    console.log("/app/smartlink params", params);

    const response = await fastEditor.createSmartLink(params);

    console.log("POST request to /app/smartlink endpoint is success.");
    return Response.json(
      {
        statusCode: 200,
        statusText: "SmartLink created",
        body: {url: response.URL},
        ok: true,
      },
      {
        status: 200
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error("/app/smartlink failed with error:", errorMessage);

    return Response.json(
      {
        statusCode: 500,
        statusText: "Unexpected error",
        ok: false
      },
      {
        status: 200
      }
    );
  }
};
