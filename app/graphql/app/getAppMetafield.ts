export const GET_APP_METAFIELD = `
  #graphql
  query GetAppMetafield($namespace: String!, $key: String!) {
    currentAppInstallation {
      metafield(namespace: $namespace, key: $key) {
        value
      }
    }
  }
`;
