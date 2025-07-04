export const GET_SHOP_INFO = `query {
  shop {
    name
    myshopifyDomain
    currencyCode
    billingAddress {
      countryCodeV2
    }
  }
}`
