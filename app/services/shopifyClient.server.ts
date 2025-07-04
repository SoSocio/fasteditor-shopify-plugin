import type { GraphQLClient} from "@shopify/graphql-client";
import {createGraphQLClient} from "@shopify/graphql-client";
import nodeFetch from "node-fetch";
import {apiVersion} from "../shopify.server";

export function shopifyClient(
  shop: string,
  accessToken: string
): GraphQLClient {
  return createGraphQLClient({
    url: `https://${shop}/admin/api/${apiVersion}/graphql.json`,
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": accessToken,
    },
    customFetchApi: nodeFetch,
  });
}
