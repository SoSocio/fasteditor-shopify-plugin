import React from "react";
import {useLoaderData} from "@remix-run/react";
import type {LoaderFunctionArgs} from "@remix-run/node";
import {Page, Layout, Card, BlockStack} from "@shopify/polaris";

import type {DashboardLoader} from "../components/DashboardPage/dashboard.types";
import {authenticate} from "../shopify.server";
import {pagination} from "../utils/pagination";
import {GET_PRODUCTS_BY_QUERY} from "../graphql/query/getProductsByTag";
import {getShopSettings} from "../models/shopSettings.server";
import {ProductsTable} from "../components/DashboardPage/ProductsTable";
import {ProductsTableInfo} from "../components/DashboardPage/ProductsTableInfo";

export const loader = async ({request}: LoaderFunctionArgs): Promise<DashboardLoader> => {
  const {admin, session} = await authenticate.admin(request);

  const limit = 10;
  const cursorVars = pagination(request, limit);

  console.log("[Dashboard Loader] Pagination variables:", cursorVars);

  const response = await admin.graphql(GET_PRODUCTS_BY_QUERY, {
    variables: {
      query: "tag:fasteditor",
      ...cursorVars,
    },
  });

  const json = await response.json();
  const productsData = json.data.products;

  console.log(`[Dashboard Loader] Fetched ${productsData.edges.length} products`);

  const shopSettings = await getShopSettings(session.shop);
  if (!shopSettings) {
    const message = `[Dashboard Loader Error] No shop settings found for ${session.shop}`
    console.log(message);
    throw new Error(message);
  }

  const shopName = session.shop.replace(".myshopify.com", "");

  return {
    productsData,
    shopData: {
      name: shopName,
      locale: shopSettings.language,
      currency: shopSettings.currency,
    },
    productsLimit: limit,
  }
};

export default function Dashboard() {
  const data = useLoaderData<DashboardLoader>();
  const {productsData, productsLimit, shopData} = data;

  console.log("[Dashboard Client] Rendering Dashboard for", shopData.name);

  return (
    <Page fullWidth>
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <ProductsTableInfo/>
              <ProductsTable
                productsData={productsData}
                shopData={shopData}
                productsLimit={productsLimit}
              />
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
