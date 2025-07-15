import { FastEditorAPI } from './fastEditorAPI.server';
import {getShopSettings, upsertFastEditorShopSettings} from '../models/shopSettings.server';
import type {authenticateAdmin} from "../types/shopify";
import {getShopInfo, getShopLocale} from "./shop.server";

export interface FastEditorIntegrationData {
  URL: string;
}

/**
 * Returns a FastEditorAPI instance for a specific shop.
 * @param shopId - The unique identifier of the shop.
 * @returns FastEditorAPI instance configured for the shop.
 * @throws Error if shop settings are not found.
 */
export async function getFastEditorAPIForShop(shopId: string): Promise<FastEditorAPI> {
  // Fetch FastEditor settings for the shop from the database
  const settings = await getShopSettings(shopId);

  if (!settings || !settings.fastEditorApiKey || !settings.fastEditorDomain) {
    throw new Error(`FastEditor settings not found for shop: ${shopId}`);
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
