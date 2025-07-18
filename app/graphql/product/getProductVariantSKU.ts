export const GET_PRODUCT_VARIANT_SKU = `
  #graphql
  query ($id: ID!) {
    productVariant(id: $id) {
      id
      sku
    }
  }`
