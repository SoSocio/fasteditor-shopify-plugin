export const UPDATE_PRICING_RULE_PRODUCT = `
  #graphql
  mutation UpdatePricingRuleProduct($product: ProductUpdateInput!, $media: [CreateMediaInput!]) {
    productUpdate(product: $product, media: $media) {
      product {
        id
        legacyResourceId
        status
        media(first: 1) {
          nodes {
            ... on MediaImage {
              id
            }
          }
        }
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
