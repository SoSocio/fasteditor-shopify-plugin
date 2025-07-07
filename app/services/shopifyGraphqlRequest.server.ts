import type { AdminGraphqlClient } from "@shopify/shopify-app-remix/server";

export async function shopifyGraphqlRequest<T = any>(
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
