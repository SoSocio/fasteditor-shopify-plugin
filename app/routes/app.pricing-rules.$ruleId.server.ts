import type {ActionFunctionArgs, LoaderFunctionArgs} from "@remix-run/node";
import {json, redirect} from "@remix-run/node";

import {authenticate} from "../shopify.server";
import {getAppMetafield} from "../services/app.server";
import {
  createPricingRule,
  deletePricingRule,
  getPricingRuleById,
  getPricingRules,
  updatePricingRule
} from "../services/pricingRules.server";
import type {PricingRule, PricingRuleActionData, PricingRuleFormValues} from "../types/pricingRules.types";
import type {PageInfo, Product} from "../types/products.types";
import {buildProductsVariables, getProductsByQuery} from "../services/products.server";
import {getShopSettings} from "../models/shopSettings.server";

const ENDPOINT = "/app/pricing-rules";

interface PricingRuleLoader {
  rule: PricingRule | null;
  appAvailability: string | null;
  shopName: string;
  products: { node: Product }[];
  pageInfo: PageInfo;
  blockedTargetIds: string[];
  shopSettings: {
    country: string;
    currency: string;
  };
}

function isGiftCardProduct(product: Product): boolean {
  const type = (product.productType || "").toLowerCase();
  if (type.includes("gift card") || type === "giftcard" || type === "gift-card") {
    return true;
  }
  const tags = (product.tags || []).map((tag) => tag.toLowerCase());
  return tags.includes("gift card") || tags.includes("giftcard") || tags.includes("gift-card");
}

export const loader = async (
  {request, params}: LoaderFunctionArgs
): Promise<PricingRuleLoader> => {
  const {admin, session} = await authenticate.admin(request);
  const ruleId = params.ruleId;

  try {
    const limit = 15;
    const appAvailability = await getAppMetafield(admin, "fasteditor_app", "availability");
    const allRules = await getPricingRules(admin);
    const productsVariables = buildProductsVariables(
      request,
      limit,
      'tag:fasteditor -product_type:"Gift Card"'
    );
    const productsData = await getProductsByQuery(admin, productsVariables);
    const filteredProducts = (productsData?.edges ?? []).filter(
      ({node}) => !isGiftCardProduct(node)
    );
    const shopSettings = await getShopSettings(session.shop);
    const shopName = session.shop.replace(".myshopify.com", "");
    const blockedTargetIds = allRules
      .filter((existingRule) => {
        if (!ruleId || ruleId === "new") {
          return true;
        }

        return existingRule.legacyResourceId !== ruleId;
      })
      .flatMap((existingRule) => existingRule.targetIds);

    if (!ruleId || ruleId === "new") {
      return {
        rule: null,
        appAvailability: appAvailability?.value ?? null,
        shopName,
        products: filteredProducts,
        pageInfo: productsData?.pageInfo ?? {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: null,
          endCursor: null,
        },
        blockedTargetIds,
        shopSettings: {
          country: shopSettings?.country || "US",
          currency: shopSettings?.currency || "USD",
        },
      };
    }

    const rule = await getPricingRuleById(admin, ruleId);

    return {
      rule,
      appAvailability: appAvailability?.value ?? null,
      shopName,
      products: filteredProducts,
      pageInfo: productsData?.pageInfo ?? {
        hasNextPage: false,
        hasPreviousPage: false,
        startCursor: null,
        endCursor: null,
      },
      blockedTargetIds,
      shopSettings: {
        country: shopSettings?.country || "US",
        currency: shopSettings?.currency || "USD",
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[${ENDPOINT}] Loader error:`, errorMessage);
    return {
      rule: null,
      appAvailability: null,
      shopName: session.shop.replace(".myshopify.com", ""),
      products: [],
      pageInfo: {
        hasNextPage: false,
        hasPreviousPage: false,
        startCursor: null,
        endCursor: null,
      },
      blockedTargetIds: [],
      shopSettings: {
        country: "US",
        currency: "USD",
      },
    };
  }
};

export const action = async ({request, params}: ActionFunctionArgs): Promise<Response> => {
  const {admin} = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = String(formData.get("intent") || "");
  const ruleId = params.ruleId;

  if (intent === "delete") {
    if (!ruleId || ruleId === "new") {
      return new Response("Missing ruleId", {status: 400});
    }
    await deletePricingRule(admin, ruleId);
    return redirect(ENDPOINT);
  }

  if (intent !== "save") {
    return new Response("Method not allowed", {status: 405});
  }

  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const pricePerExtraPage = String(formData.get("pricePerExtraPage") || "").trim();
  const enabled = String(formData.get("enabled") || "false") === "true";
  const targetType = String(formData.get("targetType") || "").trim();
  const targetIdsRaw = String(formData.get("targetIds") || "").trim();
  const targetTitlesRaw = String(formData.get("targetTitles") || "").trim();

  const targetIds = (() => {
    if (!targetIdsRaw) return [];
    try {
      const parsed = JSON.parse(targetIdsRaw);
      return Array.isArray(parsed) ? parsed.map((id) => String(id)) : [];
    } catch {
      return targetIdsRaw ? [targetIdsRaw] : [];
    }
  })();

  const targetTitles = (() => {
    if (!targetTitlesRaw) return [];
    try {
      const parsed = JSON.parse(targetTitlesRaw);
      return Array.isArray(parsed) ? parsed.map((title) => String(title)) : [];
    } catch {
      return targetTitlesRaw ? [targetTitlesRaw] : [];
    }
  })();

  const errors: PricingRuleActionData["errors"] = {};
  if (!name) {
    errors.name = "required";
  }
  if (!pricePerExtraPage) {
    errors.pricePerExtraPage = "required";
  } else if (Number.isNaN(Number(pricePerExtraPage))) {
    errors.pricePerExtraPage = "invalid";
  }
  if (!targetIds.length || !targetType) {
    errors.targetId = "required";
  }

  if (Object.keys(errors).length > 0) {
    return json<PricingRuleActionData>(
      {ok: false, errors},
      {status: 400}
    );
  }

  const values: PricingRuleFormValues = {
    name,
    description,
    pricePerExtraPage,
    enabled,
    targetType: targetType as PricingRuleFormValues["targetType"],
    targetIds,
    targetTitles,
  };

  if (!ruleId || ruleId === "new") {
    await createPricingRule(admin, values);
  } else {
    await updatePricingRule(admin, ruleId, values);
  }

  return redirect(ENDPOINT);
};
