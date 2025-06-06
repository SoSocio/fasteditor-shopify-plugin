import prisma from '../db.server';

export interface ShopSettings {
  id: string;
  shop: string;
  fastEditorApiKey: string;
  fastEditorDomain: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Retrieves FastEditor settings for a specific shop from the database.
 * @param shopId - The unique identifier (shop domain) of the shop.
 * @returns The shop's FastEditor settings or null if not found.
 */
export async function getShopSettings(shopId: string): Promise<ShopSettings | null> {
  // Query the ShopSettings table for the given shop domain
  return prisma.shopSettings.findUnique({
    where: { shop: shopId },
  });
} 