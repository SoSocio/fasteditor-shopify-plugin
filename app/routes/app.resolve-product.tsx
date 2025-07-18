import type {ActionFunctionArgs, LoaderFunctionArgs} from "@remix-run/node";
import {actionMethodNotAllowed} from "../errors/actionMethodNotAllowed";

type ProductData = {
  projectKey: number;
  quantity: number;
  customAttributes: {
    variantId?: string;
    [key: string]: any;
  };
};

const ENDPOINT = "/app/resolve-product";

export const loader = async ({request}: LoaderFunctionArgs) => {
  try {
    console.info(`[${ENDPOINT}] GET request. Request details:`, request);

    const urlObj = new URL(request.url);
    const urlParam = urlObj.searchParams.get("url");

    if (!urlParam || !urlParam.trim()) {
      console.warn(`[${ENDPOINT}] Missing or invalid "url" query param.`);
      return new Response(JSON.stringify({
        ok: false,
        statusCode: 400,
        error: "BadRequest",
        message: "Query param must include a non-empty 'url' field.",
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        }
      });
    }

    const externalResponse = await fetch(urlParam, {method: "GET"});

    if (!externalResponse.ok) {
      const message = `External fetch failed with status ${externalResponse.status}`;
      console.warn(`[${ENDPOINT}] ${message}`);
      return new Response(JSON.stringify({
        ok: false,
        statusCode: externalResponse.status,
        error: "ExternalServiceError",
        message,
      }), {
        status: externalResponse.status,
        headers: {
          "Content-Type": "application/json",
        }
      });
    }

    const externalData = await externalResponse.json();
    const [product]: ProductData[] = externalData;

    if (
      !product ||
      !product.projectKey ||
      !product.quantity ||
      !product.customAttributes?.variantId
    ) {
      console.warn(`[${ENDPOINT}] Incomplete product data`);
      return new Response(JSON.stringify({
        ok: false,
        statusCode: 422,
        error: "UnprocessableEntity",
        message: "Response from external service is missing required fields.",
      }), {
        status: 422,
        headers: {
          "Content-Type": "application/json",
        }
      });
    }

    return new Response(JSON.stringify({
      ok: true,
      statusCode: 200,
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
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[${ENDPOINT}] Internal error:`, message);

    return new Response(JSON.stringify({
      ok: false,
      statusCode: 500,
      error: "InternalServerError",
      message: "Unexpected error occurred: " + message,
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      }
    });
  }
};


export const action = async ({request}: ActionFunctionArgs) => {
  actionMethodNotAllowed({
    request,
    allowedMethods: [],
    endpoint: ENDPOINT,
  });
};
