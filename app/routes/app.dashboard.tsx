import React from "react";
import {useLoaderData} from "@remix-run/react";
import type {LoaderFunctionArgs} from "@remix-run/node";
import {BlockStack, Card, Layout, Page} from "@shopify/polaris";
import {ProductsTable} from "../components/DashboardPage/ProductsTable";
import {ProductsTableInfo} from "../components/DashboardPage/ProductsTableInfo";

import type {DashboardData} from "../types/dashboard.types";
import {authenticate} from "../shopify.server";
import {getProductsByQuery, pagination} from "../services/products.server";
import {getShopSettings} from "../models/shopSettings.server";
import ErrorBanner from "../components/DashboardPage/ErrorBanner";
import {billingRequire} from "../services/billing.server";
import {
  IndexTableWithFilteringExample
} from "../components/DashboardPage/IndexTableWithFilteringExample";

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
    const productsPagination = pagination(request, limit);
    // const sort = "TITLE"

    const url = new URL(request.url);
    const searchParam = url.searchParams;
    const order = searchParam.get("order") ?? "title asc";
    const [sortKeyRaw, sortDirectionRaw] = order.split(" ");
    const sortKey = sortKeyRaw?.toUpperCase() || "TITLE";
    const sortDirection = sortDirectionRaw?.toLowerCase() === "desc" ? "desc" : "asc";
    const sort = {
      sortKey: sortKey,
      reverse: sortDirection !== "asc",
    }


    const productsData = await getProductsByQuery(admin, productsPagination, sort);

    const shopSettings = await getShopSettings(session.shop);
    if (!shopSettings) {
      console.error(`[${ENDPOINT}] Loader Error: Shop settings not found for shop: ${session.shop}`);
      throw new Error("Shop settings not found");
    }

    const shopName = session.shop.replace(".myshopify.com", "");

    return {
      productsData,
      shopName,
      shopSettings: {
        locale: shopSettings.language,
        currency: shopSettings.currency,
        fastEditorApiKey: shopSettings?.fastEditorApiKey,
        fastEditorDomain: shopSettings?.fastEditorDomain,
      },
      productsLimit: limit,
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
    !data?.productsData ||
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

  const {productsData, shopName, shopSettings, productsLimit} = data;
  console.log('productsData', productsData);

  return (
    <Page fullWidth>
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <IndexTableWithFilteringExample productsData={productsData}/>
              <ProductsTableInfo/>
              <ProductsTable
                productsData={productsData}
                shopName={shopName}
                shopSettings={shopSettings}
                productsLimit={productsLimit}
              />
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
export default Dashboard;
