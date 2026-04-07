export const GET_SHOP_INFO = `
  #graphql
  query GetShopInfo {
    shop {
      name
      myshopifyDomain
      currencyCode
      billingAddress {
        countryCodeV2
      }
    }
  }`
