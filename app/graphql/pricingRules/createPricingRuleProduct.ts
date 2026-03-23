export const CREATE_PRICING_RULE_PRODUCT = `
  #graphql
  mutation CreatePricingRuleProduct($product: ProductCreateInput!) {
    productCreate(product: $product) {
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
