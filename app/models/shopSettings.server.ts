import prisma from '../db.server';
import type {ShopInfo, ShopSettingsCore} from "../types/shop.types";

/**
 * Interface representing the FastEditor settings for a specific shop.
 */
export interface ShopSettings extends ShopSettingsCore {
  id: string;
  shop: string;
  shopifySubscriptionId: string | null;
  subscriptionStatus: string | null;
  subscriptionCurrentPeriodEnd: Date | null;
  fastEditorApiKey: string | null;
  fastEditorDomain: string | null;
  language: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Retrieves FastEditor settings for a specific shop from the database.
 *
 * @param shop - The shop domain.
 * @returns The shop's FastEditor settings or null if not found.
 */
export async function getShopSettings(shop: string): Promise<ShopSettings | null> {
  return await prisma.shopSettings.findUnique({
    where: {shop},
  });
}

/**
 * Upserts (updates or creates) app subscription info for a shop.
 *
 * @param shop - The shop domain.
 * @param chargeId - Shopify subscription charge ID.
 * @returns The updated or created ShopSettings record.
 */
export async function upsertSubscriptionShopSettings(
  shop: string,
  chargeId: string
): Promise<ShopSettings> {
  return await prisma.shopSettings.upsert({
    where: {shop},
    update: {
      shopifySubscriptionId: chargeId,
      subscriptionStatus: "active",
      subscriptionCurrentPeriodEnd: new Date(),
    },
    create: {
      shop,
      shopifySubscriptionId: chargeId,
      subscriptionStatus: "active",
      subscriptionCurrentPeriodEnd: new Date(),
    },
  });
}


/**
 * Upserts (updates or creates) FastEditor API and localization settings for a shop.
 *
 * @param shop - The shop domain.
 * @param fastEditorApiKey - FastEditor API key.
 * @param fastEditorDomain - FastEditor API domain.
 * @param language - Primary shop language.
 * @param shopInfo - Shopify shop info containing country and currency codes.
 * @returns The updated or created ShopSettings record.
 */
export async function upsertFastEditorShopSettings(
  shop: string,
  fastEditorApiKey: string,
  fastEditorDomain: string,
  language: string,
  shopInfo: ShopInfo,
): Promise<ShopSettings> {
  return await prisma.shopSettings.upsert({
    where: {
      shop: shop,
    },
    update: {
      fastEditorApiKey,
      fastEditorDomain,
      language,
      country: shopInfo.countryCode,
      currency: shopInfo.currency
    },
    create: {
      shop: shop,
      fastEditorApiKey,
      fastEditorDomain,
      language,
      country: shopInfo.countryCode,
      currency: shopInfo.currency
    },
  });
}


/**
 * Marks the shop's subscription as inactive in the database.
 *
 * @param shop - The shop domain
 * @returns Updated shop settings
 */
export async function deactivateShopSubscription(
  shop: string
): Promise<ShopSettings> {
  return await prisma.shopSettings.update({
    where: {shop},
    data: {
      shopifySubscriptionId: null,
      subscriptionStatus: null,
      subscriptionCurrentPeriodEnd: null,
    }
  });
}

/**
 * Deletes the shop settings record for a given shop.
 *
 * @param shop - The shop domain
 * @returns Promise resolving to the deleted ShopSettings record
 */
export async function deleteShopSettings(
  shop: string
): Promise<ShopSettings> {
  return await prisma.shopSettings.delete({where: {shop}});
}
