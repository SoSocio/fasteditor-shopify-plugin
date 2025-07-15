export const GET_SHOP_INFO = `
  #graphql
  query {
    shop {
      name
      myshopifyDomain
      currencyCode
      billingAddress {
        countryCodeV2
      }
    }
  }`
