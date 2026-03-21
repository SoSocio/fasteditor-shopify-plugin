export const PUBLISH_PRICING_RULE_PRODUCT = `
  #graphql
  mutation PublishPricingRuleProduct($id: ID!, $input: [PublicationInput!]!, $publicationId: ID!) {
    publishablePublish(id: $id, input: $input) {
      publishable {
        publishedOnPublication(publicationId: $publicationId)
      }
      userErrors {
        field
        message
      }
    }
  }
`;
