export const GET_APP_BY_KEY = `
  #graphql
  query getAppInfoByKey($clientId: String!) {
    appByKey(apiKey: $clientId) {
      title
      handle
    }
  }
`;
