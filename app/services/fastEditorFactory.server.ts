import type {authenticateAdmin} from "../types/app.types";
import type {FastEditorIntegrationData, FastEditorShopSettings} from "../types/fastEditor.types";
import { FastEditorAPI } from './fastEditorAPI.server';
import {getShopSettings, upsertFastEditorShopSettings} from '../models/shopSettings.server';
import {getShopInfo, getShopLocale} from "./shop.server";

export async function getFastEditorShopSettings(shop: string): Promise<FastEditorShopSettings> {
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

  if (!settings) {
    throw new Error(`FastEditor settings not found for shop: ${shop}`);
  }

  // Return a new FastEditorAPI instance with shop-specific credentials
  return new FastEditorAPI(settings.fastEditorApiKey, settings.fastEditorDomain);
}

export async function fastEditorIntegration(
  admin: authenticateAdmin,
  shop: string,
  apiKey: string,
  apiDomain: string
): Promise<FastEditorIntegrationData> {
  const shopInfo = await getShopInfo(admin)
  const shopLocale = await getShopLocale(admin)

  const fastEditor = new FastEditorAPI(apiKey, apiDomain);

  const response: FastEditorIntegrationData = await fastEditor.checkShopIntegration();

  await upsertFastEditorShopSettings(shop, apiKey, apiDomain, shopLocale, shopInfo)

  return response;
}
