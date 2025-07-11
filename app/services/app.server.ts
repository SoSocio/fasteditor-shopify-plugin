import type {AdminGraphqlClient} from "@shopify/shopify-app-remix/server";
import {GET_APP_INFO_BY_KEY} from "../graphql/app/getAppInfoByKey";
import {APP_CLIENT_ID} from "../constants";

interface AppInfo {
  title: string;
  handle: string;
}

export async function adminGraphqlRequest<T = any>(
  graphql: AdminGraphqlClient,
  query: string,
  variables?: Record<string, any>
): Promise<T> {
  try {
    const response = await graphql(query, variables);

    console.log("response", response);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Shopify GraphQL error:", errorText);
      throw new Error(errorText);
    }

    const responseJson = await response.json();

    return responseJson.data;
  } catch (error) {
    console.error("Shopify GraphQL error:", error);
    throw error;
  }
}

export async function getAppInfoByKey(graphql: AdminGraphqlClient):Promise<AppInfo> {
  const response = await adminGraphqlRequest(graphql, GET_APP_INFO_BY_KEY, {
    variables: {clientId: APP_CLIENT_ID}
  })
  return response.appByKey
}
