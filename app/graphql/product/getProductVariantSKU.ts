export const GET_PRODUCT_VARIANT_SKU = `
  #graphql
  query GetProductVariantSku($id: ID!) {
    productVariant(id: $id) {
      id
      sku
    }
  }`
