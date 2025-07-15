export const CREATE_APP_USAGE_RECORD = `
  #graphql
  mutation appUsageRecordCreate($description: String!, $price: MoneyInput!, $subscriptionLineItemId: ID!) {
    appUsageRecordCreate(description: $description, price: $price, subscriptionLineItemId: $subscriptionLineItemId) {
      userErrors {
        field
        message
      }
      appUsageRecord {
        id
      }
    }
  }
`
