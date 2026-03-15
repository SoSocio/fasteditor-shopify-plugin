export const GET_SHOP_LOCALES = `
  #graphql
  query GetShopLocales {
    shopLocales {
      locale
      primary
      published
    }
  }`
