import { FastEditorAPI } from './fastEditorAPI.server';
import { getShopSettings } from '../models/shopSettings.server';

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