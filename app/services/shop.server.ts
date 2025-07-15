import type {authenticateAdmin} from "../types/shopify";
import {adminGraphqlRequest} from "./app.server";
import {GET_SHOP_INFO} from "../graphql/shop/getShopInfo";
import {GET_SHOP_LOCALES} from "../graphql/shop/getShopLocales";

export interface ShopInfo {
  countryCode: string;
  currency: string;
}

export async function getShopInfo(admin: authenticateAdmin): Promise<ShopInfo> {
  const shopInfoData = await adminGraphqlRequest(admin, GET_SHOP_INFO)

  return {
    countryCode: shopInfoData.billingAddress.countryCodeV2,
    currency: shopInfoData.currencyCode
  }
}

export async function getShopLocale(admin: authenticateAdmin): Promise<string> {
  const shopLocalesData = await adminGraphqlRequest(admin, GET_SHOP_LOCALES)

  return shopLocalesData.shopLocales.find((locale: {
    primary: boolean
  }) => locale.primary).locale
}
