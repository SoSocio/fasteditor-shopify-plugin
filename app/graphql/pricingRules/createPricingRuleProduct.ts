export const CREATE_PRICING_RULE_PRODUCT = `
  #graphql
  mutation CreatePricingRuleProduct($product: ProductCreateInput!) {
    productCreate(product: $product) {
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
