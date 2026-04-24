import type {IntegrationShopSettings} from "../types/shop.types";
import type {IntegrationErrorsData} from "../types/integration.types";
import type {FastEditorIntegrationData} from "../types/fastEditor.types";
import {FastEditorAPI} from './fastEditorAPI.server';
import {getShopSettings, upsertFastEditorShopSettings} from '../models/shopSettings.server';

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
 * @param shop - The shop domain
 * @param apiKey - FastEditor API key
 * @param apiDomain - FastEditor domain
 * @returns FastEditor integration result
 */
export async function setupFastEditorIntegration(
  shop: string,
  apiKey: string,
  apiDomain: string
): Promise<FastEditorIntegrationData> {
  const fastEditor = new FastEditorAPI(apiKey, apiDomain);
  const integrationData = await fastEditor.checkShopIntegration();

  await upsertFastEditorShopSettings(shop, apiKey, apiDomain);

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
 * Note: Error messages are returned as translation keys and should be translated on the client side
 * @param apiKey - FastEditor API Key
 * @param apiDomain - FastEditor Domain
 * @returns Errors object with keys that match translation keys
 */
export function validateFormData(apiKey: string, apiDomain: string): IntegrationErrorsData {
  const errors: IntegrationErrorsData = {};
  if (!apiKey) errors.apiKey = "api-key-required";
  if (!apiDomain) errors.apiDomain = "api-domain-required";
  return errors;
}
