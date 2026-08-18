import type {IntegrationShopSettings} from "../types/shop.types";
import type {IntegrationErrorsData} from "../types/integration.types";
import type {FastEditorIntegrationData} from "../types/fastEditor.types";
import {FastEditorAPI} from './fastEditorAPI.server';
import {getShopSettings, upsertFastEditorShopSettings} from '../models/shopSettings.server';
import {
  type FastEditorDomainType,
  isFastEditorDomainType,
  normalizeDomainInput,
  resolveActiveFastEditorDomain,
} from "../utils/fastEditorDomain";

export async function getFastEditorShopSettings(shop: string): Promise<IntegrationShopSettings> {
  const shopSettings = await getShopSettings(shop);

  return {
    fastEditorApiKey: shopSettings?.fastEditorApiKey ?? "",
    fastEditorDomain: shopSettings?.fastEditorDomain ?? "",
    fastEditorCustomDomain: shopSettings?.fastEditorCustomDomain ?? "",
    fastEditorActiveDomainType: shopSettings?.fastEditorActiveDomainType ?? null,
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
  const activeDomainType = isFastEditorDomainType(settings?.fastEditorActiveDomainType)
    ? settings.fastEditorActiveDomainType
    : "fasteditor";
  const activeDomain = resolveActiveFastEditorDomain(
    activeDomainType,
    settings?.fastEditorDomain,
    settings?.fastEditorCustomDomain
  );

  if (!settings || !settings?.fastEditorApiKey || !activeDomain) {
    throw new Error(`FastEditor settings not found for shop: ${shop}`);
  }

  // Return a new FastEditorAPI instance with shop-specific credentials
  return new FastEditorAPI(settings.fastEditorApiKey, activeDomain);
}

/**
 * Sets up FastEditor integration for a shop.
 * @param shop - The shop domain
 * @param apiKey - FastEditor API key
 * @param customDomain - Custom FastEditor domain
 * @param activeDomainType - Active domain type
 * @returns FastEditor integration result
 */
export async function setupFastEditorIntegration(
  shop: string,
  apiKey: string,
  fastEditorDomain: string,
  customDomain: string,
  activeDomainType: FastEditorDomainType,
): Promise<FastEditorIntegrationData> {
  const normalizedFastEditorDomain = normalizeDomainInput(fastEditorDomain);
  const normalizedCustomDomain = normalizeDomainInput(customDomain);
  const activeDomain = resolveActiveFastEditorDomain(
    activeDomainType,
    normalizedFastEditorDomain,
    normalizedCustomDomain
  );

  console.info("[FastEditor setupFastEditorIntegration] Resolved request config", {
    shop,
    activeDomainType,
    fastEditorDomain: normalizedFastEditorDomain,
    customDomain: normalizedCustomDomain,
    activeDomain,
    apiKeyPreview: apiKey ? `${apiKey.slice(0, 4)}***${apiKey.slice(-4)}` : "",
  });

  const fastEditor = new FastEditorAPI(apiKey, activeDomain);
  const integrationData = await fastEditor.checkShopIntegration();

  await upsertFastEditorShopSettings(
    shop,
    apiKey,
    normalizedFastEditorDomain,
    normalizedCustomDomain || null,
    activeDomainType
  );

  return integrationData;
}

/**
 * Parses form data from the request
 * @param request - Incoming request
 * @returns Parsed apiKey, domains and activeDomainType
 */
export async function parseFormData(
  request: Request
): Promise<{ apiKey: string; fastEditorDomain: string; customDomain: string; activeDomainType: FastEditorDomainType }> {
  const formData = await request.formData();
  const activeDomainTypeValue = String(formData.get("activeDomainType") || "");

  return {
    apiKey: String(formData.get("apiKey") || "").trim(),
    fastEditorDomain: normalizeDomainInput(String(formData.get("fastEditorDomain") || "")),
    customDomain: normalizeDomainInput(String(formData.get("customDomain") || "")),
    activeDomainType: isFastEditorDomainType(activeDomainTypeValue) ? activeDomainTypeValue : "fasteditor",
  };
}

/**
 * Validates form data
 * Note: Error messages are returned as translation keys and should be translated on the client side
 * @param apiKey - FastEditor API Key
 * @param customDomain - Custom FastEditor domain
 * @param activeDomainType - Active domain type
 * @returns Errors object with keys that match translation keys
 */
export function validateFormData(
  apiKey: string,
  fastEditorDomain: string,
  customDomain: string,
  activeDomainType: FastEditorDomainType
): IntegrationErrorsData {
  const errors: IntegrationErrorsData = {};
  if (!apiKey) errors.apiKey = "api-key-required";
  if (activeDomainType === "fasteditor" && !fastEditorDomain) {
    errors.fastEditorDomain = "fasteditor-domain-required";
  }
  if (activeDomainType === "custom" && !customDomain) {
    errors.customDomain = "custom-domain-required";
  }
  return errors;
}
