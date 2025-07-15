export const GET_CURRENT_APP_INSTALLATION = `
  #graphql
  query {
    currentAppInstallation {
      activeSubscriptions {
        id
        name
        lineItems {
          id
          plan {
            pricingDetails {
              __typename
            }
          }
        }
      }
    }
  }
`
