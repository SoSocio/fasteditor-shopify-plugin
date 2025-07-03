import React from "react";
import {authenticate} from "../shopify.server";
import type {LoaderFunctionArgs} from "@remix-run/node";
import {pagination} from "../utils/pagination";
import {GET_PRODUCTS_BY_QUERY} from "../graphql/query/getProductsByTag";
import {useLoaderData} from "@remix-run/react";
import {Page, Layout, Card, BlockStack} from "@shopify/polaris";
import {ProductsTableInfo} from "../components/DashboardPage/ProductsTableInfo";
import {ProductsTable} from "../components/DashboardPage/ProductsTable";
import {WithNestedRowsExample} from "../components/DashboardPage/WithNestedRowsExample";

export const loader = async ({request}: LoaderFunctionArgs) => {
  const {admin, session} = await authenticate.admin(request);

  const productsLimit = 10;
  const variables = pagination(request, productsLimit)

  console.log("app.dashboard.tsx loader. variables: ", variables);

  const response = await admin.graphql(
    GET_PRODUCTS_BY_QUERY, {
      variables: {
        query: `tag:fasteditor`,
        ...variables,
      }
    }
  )

  const responseJson = await response.json();
  const productsData = responseJson.data.products
  console.log("app.dashboard.tsx loader. productsData:", productsData);

  const shopName = session.shop.replace(".myshopify.com", "")
  console.log("app.dashboard.tsx loader. shopName:", shopName);

  return {
    productsData,
    shopName,
    productsLimit
  }
};

export default function Dashboard() {
  const {productsData, shopName, productsLimit} = useLoaderData()
  console.log("app.dashboard.tsx client. productsData:", productsData);

  return (
    <Page fullWidth>
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <ProductsTableInfo/>
              <ProductsTable productsData={productsData} shop={shopName} limit={productsLimit}/>
              <WithNestedRowsExample/>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
