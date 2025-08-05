import type {authenticateAdmin} from "../types/app.types";
import type {ShopInfo} from "../types/shop.types";
import {adminGraphqlRequest} from "./app.server";
import {GET_SHOP_INFO} from "../graphql/shop/getShopInfo";
import {GET_SHOP_LOCALES} from "../graphql/shop/getShopLocales";

/**
 * Fetches country and currency information for the current shop.
 *
 * @param admin - Shopify Admin API client
 * @returns Object containing country code and currency code
 */
export async function getShopInfo(admin: authenticateAdmin): Promise<ShopInfo> {
  const shopInfoData = await adminGraphqlRequest(admin, GET_SHOP_INFO)

  return {
    countryCode: shopInfoData.shop.billingAddress.countryCodeV2,
    currency: shopInfoData.shop.currencyCode
  }
}

/**
 * Fetches the primary locale for the current shop.
 *
 * @param admin - Shopify Admin API client
 * @returns Primary locale (e.g., "en", "fr", "de")
 * @throws Error if no primary locale is found
 */
export async function getShopLocale(admin: authenticateAdmin): Promise<string> {
  const shopLocalesData = await adminGraphqlRequest(admin, GET_SHOP_LOCALES)

  return shopLocalesData.shopLocales.find((locale: {
    primary: boolean
  }) => locale.primary).locale
}
