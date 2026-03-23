export const UPDATE_PRICING_RULE_PRODUCT = `
  #graphql
  mutation UpdatePricingRuleProduct($product: ProductUpdateInput!) {
    productUpdate(product: $product) {
      product {
        id
        legacyResourceId
        status
        variants(first: 1) {
          nodes {
            id
            legacyResourceId
            price
          }
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;
