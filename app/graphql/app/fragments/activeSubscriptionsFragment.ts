export const ACTIVE_SUBSCRIPTIONS_FRAGMENT = `
  #graphql
  fragment ActiveSubscriptionsFragment on AppInstallation {
    activeSubscriptions {
      id
      name
      status
      createdAt
      currentPeriodEnd
      trialDays
      lineItems {
        id
        plan {
          pricingDetails {
            __typename
            ... on AppRecurringPricing {
              price {
                amount
                currencyCode
              }
            }
            ... on AppUsagePricing {
              balanceUsed {
                amount
                currencyCode
              }
              cappedAmount {
                amount
                currencyCode
              }
              terms
            }
          }
        }
        usageRecords(first: 10) {
          nodes {
            id
            createdAt
            description
            idempotencyKey
            price {
              amount
              currencyCode
            }
            subscriptionLineItem {
              id
            }
          }
        }
      }
    }
  }
`
