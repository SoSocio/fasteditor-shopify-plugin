import React from "react";
import {useLoaderData} from "@remix-run/react";
import type {LoaderFunctionArgs} from "@remix-run/node";
import {BlockStack, Card, Layout, Page} from "@shopify/polaris";
import {ProductsTableInfo} from "../components/DashboardPage/ProductsTableInfo";
import {ProductsTable} from "../components/DashboardPage/ProductsTable";
import ErrorBanner from "../components/DashboardPage/ErrorBanner";

import type {DashboardData} from "../types/dashboard.types";
import {authenticate} from "../shopify.server";
import {
  buildProductsVariables,
  getProductsByQuery,
} from "../services/products.server";
import {getShopSettings} from "../models/shopSettings.server";
import {billingRequire} from "../services/billing.server";

const ENDPOINT = "/app/dashboard";

/**
 * Loader function for the Dashboard page.
 */
export const loader = async (
  {request}: LoaderFunctionArgs
): Promise<DashboardData | Response> => {
  console.info(`[${ENDPOINT}] Dashboard Loader`);

  const {admin, session, billing} = await authenticate.admin(request);
  await billingRequire(admin, billing, session.shop);

  try {
    const limit = 2;

    const url = new URL(request.url);
    const searchParams = url.searchParams;
    const selectedView = searchParams.get("selectedView") || "all";

    const productsVariables = buildProductsVariables(request, limit);
    const productsData = await getProductsByQuery(admin, productsVariables);

    const allProducts = productsData.edges;

    const products =
      selectedView === "all"
        ? allProducts
        : allProducts.filter((item) =>
          item.node.status.toLowerCase() === selectedView
        );

    const shopSettings = await getShopSettings(session.shop);
    if (!shopSettings) {
      console.error(`[${ENDPOINT}] Loader Error: Shop settings not found for shop: ${session.shop}`);
      throw new Error("Shop settings not found");
    }

    const shopName = session.shop.replace(".myshopify.com", "");

    return {
      products,
      pageInfo: productsData.pageInfo,
      productsLimit: limit,
      shopName,
      shopSettings: {
        locale: shopSettings.language,
        currency: shopSettings.currency,
        fastEditorApiKey: shopSettings?.fastEditorApiKey,
        fastEditorDomain: shopSettings?.fastEditorDomain,
      }
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
  const data = useLoaderData<DashboardData>();
  const missingRequiredData =
    !data?.products ||
    !data?.pageInfo ||
    !data?.shopSettings ||
    !data?.shopSettings?.fastEditorApiKey ||
    !data?.shopSettings?.fastEditorDomain

  if (missingRequiredData) {
    return (
      <Page fullWidth>
        <Layout>
          <Layout.Section>
            <ErrorBanner/>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  const {products, pageInfo, shopName, shopSettings, productsLimit} = data;

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
                productsLimit={productsLimit}
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
