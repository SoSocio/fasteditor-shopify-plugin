export const GET_PRICING_RULES = `
  #graphql
  query GetPricingRules($first: Int!, $query: String!) {
    products(first: $first, query: $query, sortKey: TITLE) {
      edges {
        node {
          id
          legacyResourceId
          title
          status
          metafields(first: 20, namespace: "fasteditor_pricing_rule") {
            nodes {
              key
              value
              type
            }
          }
        }
      }
    }
  }
`;
