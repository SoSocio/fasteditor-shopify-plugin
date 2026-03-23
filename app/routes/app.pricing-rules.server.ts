import type {ActionFunctionArgs, LoaderFunctionArgs} from "@remix-run/node";
import {redirect} from "@remix-run/node";

import {authenticate} from "../shopify.server";
import {getAppMetafield} from "../services/app.server";
import {
  deletePricingRule,
  getPricingRules,
} from "../services/pricingRules.server";
import {getShopSettings} from "../models/shopSettings.server";
import type {PricingRule} from "../types/pricingRules.types";

const ENDPOINT = "/app/pricing-rules";

interface PricingRulesLoader {
  rules: PricingRule[];
  appAvailability: string | null;
  shopName: string;
  shopSettings: {
    country: string;
    currency: string;
  };
}

export const loader = async (
  {request}: LoaderFunctionArgs
): Promise<PricingRulesLoader> => {
  const {admin, session} = await authenticate.admin(request);

  try {
    const rules = await getPricingRules(admin);
    const appAvailability = await getAppMetafield(admin, "fasteditor_app", "availability");
    const shopSettings = await getShopSettings(session.shop);

    return {
      rules: rules ?? [],
      appAvailability: appAvailability?.value ?? null,
      shopName: session.shop.replace(".myshopify.com", ""),
      shopSettings: {
        country: shopSettings?.country || "US",
        currency: shopSettings?.currency || "USD",
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[${ENDPOINT}] Loader error:`, errorMessage);
    return {
      rules: [],
      appAvailability: null,
      shopName: session.shop.replace(".myshopify.com", ""),
      shopSettings: {
        country: "US",
        currency: "USD",
      },
    };
  }
};

export const action = async ({request}: ActionFunctionArgs): Promise<Response> => {
  const {admin} = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = String(formData.get("intent") || "");

  if (intent !== "delete") {
    return new Response("Method not allowed", {status: 405});
  }

  const ruleId = String(formData.get("ruleId") || "").trim();
  if (!ruleId) {
    return new Response("Missing ruleId", {status: 400});
  }

  await deletePricingRule(admin, ruleId);
  return redirect(ENDPOINT);
};
