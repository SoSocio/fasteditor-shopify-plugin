export const GET_PRODUCTS_BY_QUERY = `
  #graphql
  query GetProducts(
    $first: Int
    $after: String
    $last: Int
    $before: String
    $query: String
    $sortKey: ProductSortKeys
    $reverse: Boolean
  ) {
    products(
      first: $first
      after: $after
      last: $last
      before: $before
      query: $query
      sortKey: $sortKey
      reverse: $reverse
    ) {
      edges {
        cursor
        node {
          id
          title
          legacyResourceId
          status

          featuredMedia {
            preview {
              image {
                altText
                url
              }
            }
          }

          variants(first: 30) {
            nodes {
              id
              legacyResourceId
              title
              sku
              price
              inventoryQuantity
              image {
                altText
                url
              }
            }
          }
        }
      }

      pageInfo {
        startCursor
        endCursor
        hasNextPage
        hasPreviousPage
      }
    }
  }
`;
