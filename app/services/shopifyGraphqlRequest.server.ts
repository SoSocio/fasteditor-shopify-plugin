import type {ClientResponse} from '@shopify/graphql-client';
import type {Session} from "@shopify/shopify-api";
import {shopifyClient} from "./shopifyClient.server";

export async function shopifyGraphqlRequest<T = any>(
  session: Session,
  query: string,
  variables?: Record<string, any>
): Promise<T> {
  const client = shopifyClient(session.shop, session.accessToken);

  try {
    const response: ClientResponse<T> = await client.request(query, variables);

    if (response.errors) {
      console.error("Shopify GraphQL errors:", response.errors);
      throw new Error(JSON.stringify(response.errors));
    }

    if (!response.data) {
      throw new Error("No data returned from Shopify GraphQL");
    }

    return response.data;
  } catch (error) {
    console.error("Shopify GraphQL error:", error);
    throw error;
  }
}
