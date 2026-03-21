export const UPDATE_PRICING_RULE_PRODUCT = `
  #graphql
  mutation UpdatePricingRuleProduct($product: ProductUpdateInput!) {
    productUpdate(product: $product) {
      product {
        id
        legacyResourceId
        status
      }
      userErrors {
        field
        message
      }
    }
  }
`;
