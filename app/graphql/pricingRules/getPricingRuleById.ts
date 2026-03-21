export const GET_PRICING_RULE_BY_ID = `
  #graphql
  query GetPricingRuleById($id: ID!) {
    product(id: $id) {
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
`;
