export const GET_PRODUCT_VARIANTS_BY_CURSOR = `
  #graphql
  query GetProductVariantsByCursor($id: ID!, $after: String) {
    product(id: $id) {
      variants(first: 30, after: $after) {
        nodes {
          id
          title
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  }
`;
