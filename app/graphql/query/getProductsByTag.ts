// language=GraphQL
export const GET_PRODUCTS_BY_QUERY = `
  #graphgl
  query GetProducts($first: Int, $after: String, $last: Int, $before: String, $query: String) {
    products(
      first: $first
      after: $after
      last: $last
      before: $before
      query: $query
    ) {
      edges {
        cursor
        node {
          id
          title
          legacyResourceId
          featuredMedia {
            preview {
              image {
                altText
                url
              }
            }
          }
          status
          variantsCount {
            count
          }
          variants(first: 15) {
            nodes {
              id
              title
              image {
                altText
                url
              }
              sku
              price
            }
          }
        }
      }
      pageInfo {
        endCursor
        hasNextPage
        hasPreviousPage
        startCursor
      }
    }
  }`
