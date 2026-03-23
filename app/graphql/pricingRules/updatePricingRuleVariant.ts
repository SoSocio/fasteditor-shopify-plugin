export const UPDATE_PRICING_RULE_VARIANT = `
  #graphql
  mutation UpdatePricingRuleVariant(
    $productId: ID!
    $variants: [ProductVariantsBulkInput!]!
  ) {
    productVariantsBulkUpdate(productId: $productId, variants: $variants) {
      productVariants {
        id
        legacyResourceId
        price
      }
      userErrors {
        field
        message
      }
    }
  }
`;
