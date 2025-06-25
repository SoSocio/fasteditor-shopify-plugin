export const GET_PRODUCT_VARIANT_SKU = `query ($id: ID!) {
  productVariant(id: $id) {
    id
    sku
  }
}`
