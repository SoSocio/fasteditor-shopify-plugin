import React from "react";
import {useLoaderData} from "@remix-run/react";
import type {LoaderFunctionArgs} from "@remix-run/node";
import {Page, Layout, Card, BlockStack} from "@shopify/polaris";
import type {Product, PageInfo} from "../types/products.types";
import type {ShopSettingsCore} from "../types/shop.types";

import {authenticate} from "../shopify.server";
import {getShopSettings} from "../models/shopSettings.server";
import {getAppMetafield} from "../services/app.server";
import {
  buildProductsVariables,
  getProductsByQuery,
} from "../services/products.server";

import {ProductsTableInfo} from "../components/DashboardPage/ProductsTableInfo";
import {ProductsTable} from "../components/DashboardPage/ProductsTable";
import {ErrorBanner} from "../components/DashboardPage/ErrorBanner";
import {
  UsageLimitBannerWithAction
} from "../components/banners/UsageLimit/UsageLimitBannerWithAction";

const ENDPOINT = "/app/dashboard";

export interface DashboardCoreLoader {
  products: { node: Product }[];
  pageInfo: PageInfo;
  shopName: string;
  shopSettings: ShopSettingsCore;
}

export interface DashboardLoader extends DashboardCoreLoader {
  appAvailability: string;
}

/**
 * Loader function for the Dashboard page.
 */
export const loader = async (
  {request}: LoaderFunctionArgs
): Promise<DashboardLoader | Response> => {
  console.info(`[${ENDPOINT}] Dashboard Loader`);

  const {admin, session} = await authenticate.admin(request);

  try {
    const limit = 15;
    const productsVariables = buildProductsVariables(request, limit);
    console.log("productsVariables", productsVariables);
    const productsData = await getProductsByQuery(admin, productsVariables);
    const products = productsData.edges;

    const shopSettings = await getShopSettings(session.shop)
    if (!shopSettings) {
      console.error(`[${ENDPOINT}] Loader Error: Shop settings not found for shop: ${session.shop}`);
      throw new Error("Shop settings not found");
    }
    const shopName = session.shop.replace(".myshopify.com", "");
    const appAvailability = await getAppMetafield(admin, "fasteditor_app", "availability")

    console.log("productsData.pageInfo", productsData.pageInfo)

    return {
      products: products || [],
      pageInfo: productsData.pageInfo,
      shopName,
      shopSettings: {
        country: shopSettings.language,
        currency: shopSettings.currency,
      },
      appAvailability: appAvailability?.value,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error(`[${ENDPOINT}] Loader Error:`, errorMessage);
    return new Response(errorMessage,
      {status: 200}
    );
  }
};

/**
 * Renders the Dashboard UI for managing FastEditor-enabled products.
 */
const Dashboard = () => {
  const {
    products,
    pageInfo,
    shopName,
    shopSettings,
    appAvailability
  } = useLoaderData<typeof loader>();

  if (appAvailability === "false") {
    return <UsageLimitBannerWithAction shopName={shopName}/>
  }

  if (!pageInfo) {
    return (
      <Page fullWidth>
        <ErrorBanner/>
      </Page>
    )
  }

  return (
    <Page fullWidth>
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <ProductsTableInfo/>
              <ProductsTable
                products={products}
                pageInfo={pageInfo}
                shopName={shopName}
                shopSettings={shopSettings}
              />
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
export default Dashboard;
