export const SEARCH_PRODUCT_TARGETS = `
  #graphql
  query SearchProductTargets($first: Int!, $query: String!) {
    products(first: $first, query: $query, sortKey: TITLE) {
      edges {
        node {
          id
          legacyResourceId
          title
          variants(first: 30) {
            nodes {
              id
              legacyResourceId
              title
            }
          }
        }
      }
    }
  }
`;

