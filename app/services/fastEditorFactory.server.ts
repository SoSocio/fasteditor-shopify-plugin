import type {authenticateAdmin} from "../types/app.types";
import type {IntegrationShopSettings} from "../types/shop.types";
import type {IntegrationErrorsData} from "../types/integration.types";
import type {FastEditorIntegrationData} from "../types/fastEditor.types";
import {FastEditorAPI} from './fastEditorAPI.server';
import {getShopSettings, upsertFastEditorShopSettings} from '../models/shopSettings.server';
import {getShopInfo, getShopLocale} from "./shop.server";

export async function getFastEditorShopSettings(shop: string): Promise<IntegrationShopSettings> {
  const shopSettings = await getShopSettings(shop);

  return {
    fastEditorApiKey: shopSettings?.fastEditorApiKey ?? "",
    fastEditorDomain: shopSettings?.fastEditorDomain ?? "",
  }
}

/**
 * Returns a FastEditorAPI instance for a specific shop.
 * @param shop - The shop domain.
 * @returns FastEditorAPI instance configured for the shop.
 * @throws Error if shop settings are not found.
 */
export async function getFastEditorAPIForShop(shop: string): Promise<FastEditorAPI> {
  // Fetch FastEditor settings for the shop from the database
  const settings = await getFastEditorShopSettings(shop);

  if (!settings || !settings?.fastEditorApiKey || !settings?.fastEditorDomain) {
    throw new Error(`FastEditor settings not found for shop: ${shop}`);
  }

  // Return a new FastEditorAPI instance with shop-specific credentials
  return new FastEditorAPI(settings.fastEditorApiKey, settings.fastEditorDomain);
}

/**
 * Sets up FastEditor integration for a shop.
 * @param admin - Shopify admin context
 * @param shop - The shop domain
 * @param apiKey - FastEditor API key
 * @param apiDomain - FastEditor domain
 * @returns FastEditor integration result
 */
export async function setupFastEditorIntegration(
  admin: authenticateAdmin,
  shop: string,
  apiKey: string,
  apiDomain: string
): Promise<FastEditorIntegrationData> {
  const shopInfo = await getShopInfo(admin);
  const shopLocale = await getShopLocale(admin);

  const fastEditor = new FastEditorAPI(apiKey, apiDomain);
  const integrationData = await fastEditor.checkShopIntegration();

  await upsertFastEditorShopSettings(shop, apiKey, apiDomain, shopLocale, shopInfo);

  return integrationData;
}

/**
 * Parses form data from the request
 * @param request - Incoming request
 * @returns Parsed apiKey and apiDomain
 */
export async function parseFormData(request: Request): Promise<{ apiKey: string; apiDomain: string }> {
  const formData = await request.formData();
  return {
    apiKey: String(formData.get("apiKey") || ""),
    apiDomain: String(formData.get("apiDomain") || ""),
  };
}

/**
 * Validates form data
 * @param apiKey - FastEditor API Key
 * @param apiDomain - FastEditor Domain
 * @returns Errors object
 */
export function validateFormData(apiKey: string, apiDomain: string): IntegrationErrorsData {
  const errors: IntegrationErrorsData = {};
  if (!apiKey) errors.apiKey = "API Key is required";
  if (!apiDomain) errors.apiDomain = "API Domain is required";
  return errors;
}
