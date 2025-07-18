export const ACTIVE_SUBSCRIPTIONS_FRAGMENT = `
  #graphql
  fragment ActiveSubscriptionsFragment on AppInstallation {
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
`
