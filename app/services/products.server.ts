import type {authenticateAdmin, unauthenticatedAdmin} from "../types/app.types";
import type {Products, ProductsVariables} from "../types/products.types";
import {adminGraphqlRequest} from "./app.server";
import {GET_PRODUCT_VARIANT_SKU} from "../graphql/product/getProductVariantSKU";
import {GET_PRODUCTS_BY_QUERY} from "../graphql/product/getProductsByQuery";

/**
 * Fetches products with a specific tag using Shopify Admin GraphQL API.
 *
 * @param admin - Shopify Admin API client
 * @param variables - Products variables.
 * @returns Paginated list of products.
 */
export async function getProductsByQuery(
  admin: authenticateAdmin,
  variables: ProductsVariables,
): Promise<Products> {
  const data = await adminGraphqlRequest(admin, GET_PRODUCTS_BY_QUERY, {
    variables: {
      query: "tag:fasteditor",
      ...variables
    },
  });

  return data.products;
}

/**
 * Fetches SKU for a specific product variant ID.
 *
 * @param admin - Shopify Admin API client
 * @param variantId - Shopify ProductVariant ID (plain, not GID)
 * @returns Variant SKU string
 */
export async function getProductVariantSku(admin: unauthenticatedAdmin, variantId: string): Promise<string> {
  const data = await adminGraphqlRequest(admin, GET_PRODUCT_VARIANT_SKU, {
    variables: {id: `gid://shopify/ProductVariant/${variantId}`},
  });

  return data.productVariant?.sku
}

/**
 * Builds Shopify GraphQL pagination and filtering variables from the request URL.
 *
 * @param request - Incoming HTTP request object from Remix.
 * @param limit - Default number of products to return if no limit is provided in the query.
 * @returns GraphQL-compatible pagination and sorting variables.
 * @throws Error if the limit parameter is invalid (non-numeric or <= 0).
 */
export function buildProductsVariables(
  request: Request,
  limit: number,
): ProductsVariables {
  const url = new URL(request.url);
  const searchParams = url.searchParams;

  const cursor = searchParams.get("cursor")?.trim() || null;
  const rel = searchParams.get("rel");
  const rawQuery = searchParams.get("query")?.trim() || "";
  const sortParam = searchParams.get("order") || "title asc";
  const selectedView = searchParams.get("selectedView") || "all";

  if (isNaN(limit) || limit <= 0) {
    throw new Error("Invalid pagination limit");
  }

  const [sortKey, sortDirection] = sortParam.split(" ");
  const sortKeyMap: Record<string, string> = {
    title: "TITLE",
  };
  const gqlSortKey = sortKeyMap[sortKey] || "TITLE";
  const reverse = sortDirection !== "asc";

  const variables: ProductsVariables = {
    sortKey: gqlSortKey,
    reverse,
    query: `tag:fasteditor ${selectedView !== "all" ? "status:" + selectedView : ""} ${rawQuery}`,
  };

  switch (rel) {
    case "next":
      variables.first = limit;
      if (cursor) variables.after = cursor;
      break;

    case "previous":
      variables.last = limit;
      if (cursor) variables.before = cursor;
      break;

    default:
      variables.first = limit;
      break;
  }

  return variables;
}
