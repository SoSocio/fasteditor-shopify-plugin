import type {ActionFunctionArgs, LoaderFunctionArgs} from "@remix-run/node";
import {FastEditorAPI} from "../services/fastEditorAPI.server";
import * as process from "node:process";

export const loader = async ({request}: LoaderFunctionArgs) => {
  console.error("GET request to /app/smartlink endpoint is not allowed.", request);
  return new Response(null, {status: 405, statusText: "Method Not Allowed"});
};

export const action = async ({request}: ActionFunctionArgs) => {
  if (request.method !== "POST") {
    console.error(`${request.method} request to /app/smartlink endpoint is not allowed. ${request}`);
    return new Response(null, {status: 405, statusText: "Method Not Allowed"});
  }
  try {
    const data = await request.json();
    const shop = data.shop;

    // TODO: Replace temp credentials with real shop settings after integration is complete
    // const {fastEditorApiKey, fastEditorDomain} =
    //   await prisma.shopSettings.findFirst({where: {shop: shop}});

    // Temporary variables while FastEditor integration logic is not yet implemented
    const fastEditorApiKey = process.env.FASTEDITOR_DEV_API_KEY
    const fastEditorDomain = process.env.FASTEDITOR_DEV_DOMAIN

    if (!fastEditorApiKey) {
      throw new Error("Not found fastEditorApiKey");
    }

    if (!fastEditorDomain) {
      throw new Error("Not found fastEditorDomain");
    }

    const fastEditor = new FastEditorAPI(fastEditorApiKey, fastEditorDomain);

    if (!data.sku) {
      return Response.json({statusCode: 400, error: 'Missing SKU'}, {status: 200});
    }

    const cartUrl = `https://${shop}/cart`;
    const openProductOptionsOnStart = false;
    const productOptionsEnabled = true;

    const params = {
      userId: data?.userId ?? null,
      sku: data.sku,
      language: data?.language ?? null,
      country: data?.country ?? null,
      currency: data?.currency ?? null,
      custom_attributes: data?.custom_attributes ?? [],
      productOptions: {
        openOnStart: openProductOptionsOnStart,
        enabled: productOptionsEnabled,
      },
      projectId: data?.projectId ?? null,
      quantity: data?.quantity ?? null,
      cartUrl: cartUrl
    }

    const response = await fastEditor.createSmartLink(params);

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
    const message = error instanceof Error ? error.message : error;
    console.error(`/app/smartlink failed with error: ${message}`);

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
