export const GET_PUBLICATIONS = `
  #graphql
  query GetPublications($first: Int!) {
    publications(first: $first) {
      nodes {
        id
        name
        catalog {
          id
          title
        }
      }
    }
  }
`;
