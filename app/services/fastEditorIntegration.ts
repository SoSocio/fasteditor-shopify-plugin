import {shopifyGraphqlRequest} from "./shopifyGraphqlRequest.server";
import {GET_SHOP_INFO} from "../graphql/query/getShopInfo";
import {GET_SHOP_LOCALES} from "../graphql/query/getShopLocales";
import {FastEditorAPI} from "./fastEditorAPI.server";
import prisma from "../db.server";
import type {AdminGraphqlClient} from "@shopify/shopify-app-remix/server";

export interface FastEditorIntegrationData {
  URL: string;
}

export async function fastEditorIntegration(
  graphql: AdminGraphqlClient,
  shop: string,
  apiKey: string,
  apiDomain: string
): Promise<FastEditorIntegrationData> {
  const shopInfoData = await shopifyGraphqlRequest(graphql, GET_SHOP_INFO)
  const shopLocalesData = await shopifyGraphqlRequest(graphql, GET_SHOP_LOCALES)

  const shopInfo = shopInfoData.shop
  const primaryLang = shopLocalesData.shopLocales.find((locale: {
    primary: boolean
  }) => locale.primary);

  const fastEditor = new FastEditorAPI(apiKey, apiDomain);

  const response: FastEditorIntegrationData = await fastEditor.checkShopIntegration();

  await prisma.shopSettings.upsert({
    where: {
      shop: shop,
    },
    update: {
      fastEditorApiKey: apiKey,
      fastEditorDomain: apiDomain,
      language: primaryLang.locale,
      country: shopInfo.billingAddress.countryCodeV2,
      currency: shopInfo.currencyCode
    },
    create: {
      shop: shop,
      fastEditorApiKey: apiKey,
      fastEditorDomain: apiDomain,
      language: primaryLang.locale,
      country: shopInfo.billingAddress.countryCodeV2,
      currency: shopInfo.currencyCode
    },
  });

  return response;
}
