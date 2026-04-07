export const DELETE_PRICING_RULE_PRODUCT = `
  #graphql
  mutation DeletePricingRuleProduct($input: ProductDeleteInput!) {
    productDelete(input: $input) {
      deletedProductId
      userErrors {
        field
        message
      }
    }
  }
`;

