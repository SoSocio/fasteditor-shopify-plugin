import { FastEditorAPI } from './fastEditorAPI.server';
import {getShopSettings, upsertFastEditorShopSettings} from '../models/shopSettings.server';
import {GET_SHOP_INFO} from "../graphql/shop/getShopInfo";
import {GET_SHOP_LOCALES} from "../graphql/shop/getShopLocales";
import {adminGraphqlRequest} from "./app.server";
import type {authenticateAdmin} from "../types/shopify";

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
  const shopInfoData = await adminGraphqlRequest(admin, GET_SHOP_INFO)
  const shopLocalesData = await adminGraphqlRequest(admin, GET_SHOP_LOCALES)

  const shopInfo = shopInfoData.shop
  const primaryLang = shopLocalesData.shopLocales.find((locale: {
    primary: boolean
  }) => locale.primary);

  const fastEditor = new FastEditorAPI(apiKey, apiDomain);

  const response: FastEditorIntegrationData = await fastEditor.checkShopIntegration();

  await upsertFastEditorShopSettings(shop, apiKey, apiDomain, primaryLang.locale, shopInfo)

  return response;
}
