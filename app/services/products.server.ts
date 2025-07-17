import type {authenticateAdmin, unauthenticatedAdmin} from "../types/app.types";
import type {Products, ProductsPagination} from "../types/products.types";
import {GET_PRODUCTS_BY_QUERY} from "../graphql/product/getProductsByTag";
import {adminGraphqlRequest} from "./app.server";
import {GET_PRODUCT_VARIANT_SKU} from "../graphql/product/getProductVariantSKU";

/**
 * Fetches products with a specific tag using Shopify Admin GraphQL API.
 *
 * @param admin - Authenticated Shopify Admin API client
 * @param pagination - Pagination variables (first/after or last/before)
 * @returns Paginated list of products
 */
export async function getProductsByQuery(
  admin: authenticateAdmin,
  pagination: ProductsPagination
): Promise<Products> {
  const data = await adminGraphqlRequest(admin, GET_PRODUCTS_BY_QUERY, {
    variables: {
      query: "tag:fasteditor",
      ...pagination,
    },
  });

  return data.products;
}

/**
 * Fetches SKU for a specific product variant ID.
 *
 * @param admin - Unauthenticated Shopify Admin client
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
 * Parses pagination parameters from the request query.
 *
 * @param request - Incoming HTTP request
 * @param defaultLimit - Default number of items per page
 * @returns Pagination object to use in GraphQL queries
 * @throws Error if limit is invalid
 */
export function pagination(request: Request, defaultLimit: number): ProductsPagination {
  const url = new URL(request.url);
  const searchParam = url.searchParams;
  const rel = searchParam.get("rel");
  const cursor = searchParam.get("cursor")?.trim() || null;
  const limitParam = searchParam.get("limit");
  const limit = Number(limitParam ?? defaultLimit);

  const variables: ProductsPagination = {};

  if (isNaN(limit) || limit <= 0) {
    throw new Error("Invalid pagination limit");
  }

  switch (rel) {
    case "next":
      if (cursor) {
        variables.first = limit;
        variables.after = cursor;
      } else {
        variables.first = limit;
      }
      break;

    case "previous":
      if (cursor) {
        variables.last = limit;
        variables.before = cursor;
      } else {
        variables.last = limit;
      }
      break;

    default:
      variables.first = limit;
      break;
  }

  return variables;
}
