export const UPDATE_ORDER = `
  #graphql
  mutation UpdateOrderTags($input: OrderInput!) {
    orderUpdate(input: $input) {
      order {
        id
        tags
        metafield(namespace: "fasteditor_app", key: "processing_results") {
          value
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`
