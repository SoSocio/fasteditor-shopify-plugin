import type {authenticateAdmin} from "../types/shopify";
import type {Products, ProductsPagination} from "../types/products.types";
import {GET_PRODUCTS_BY_QUERY} from "../graphql/product/getProductsByTag";
import {adminGraphqlRequest} from "./app.server";

export async function getProductsByQuery(
  admin: authenticateAdmin,
  pagination:ProductsPagination
): Promise<Products> {
  const productsData = await adminGraphqlRequest(admin, GET_PRODUCTS_BY_QUERY, {
    variables: {
      query: "tag:fasteditor",
      ...pagination,
    },
  });

  return productsData.products;
}

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
