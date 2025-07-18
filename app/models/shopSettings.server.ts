import prisma from '../db.server';

/**
 * Interface representing the FastEditor settings for a shop.
 */
export interface ShopSettings {
  id: string;
  shop: string;
  shopifySubscriptionId: string | null;
  subscriptionStatus: string | null;
  subscriptionCurrentPeriodEnd: Date | null;
  fastEditorApiKey: string | null;
  fastEditorDomain: string | null;
  language: string | null;
  country: string | null;
  currency: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface ShopInfo {
  billingAddress: {
    countryCodeV2: string
  };
  currencyCode: string;
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
 * Updates or creates the shop settings with subscription information.
 *
 * @param shop - The shop domain.
 * @param chargeId - The Shopify subscription charge ID.
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
 * Updates or creates the FastEditor API and localization settings for a shop.
 *
 * @param shop - The shop domain.
 * @param apiKey - FastEditor API key.
 * @param apiDomain - FastEditor API domain.
 * @param language - Preferred shop language (e.g. 'en', 'uk').
 * @param shopInfo - Shopify shop object containing billing and currency info.
 * @returns The updated or created ShopSettings record.
 */
export async function upsertFastEditorShopSettings(
  shop: string,
  apiKey: string,
  apiDomain: string,
  language: string,
  shopInfo: ShopInfo,
): Promise<ShopSettings> {
  return await prisma.shopSettings.upsert({
    where: {
      shop: shop,
    },
    update: {
      fastEditorApiKey: apiKey,
      fastEditorDomain: apiDomain,
      language,
      country: shopInfo.billingAddress.countryCodeV2,
      currency: shopInfo.currencyCode
    },
    create: {
      shop: shop,
      fastEditorApiKey: apiKey,
      fastEditorDomain: apiDomain,
      language,
      country: shopInfo.billingAddress.countryCodeV2,
      currency: shopInfo.currencyCode
    },
  });
}
