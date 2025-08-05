import type {authenticateAdmin} from "../types/app.types";
import {CREATE_METAFIELD_DEFINITION} from "../graphql/metafields/createMetafieldDefinition";
import {METAFIELD_SET} from "../graphql/metafields/metafieldsSet";
import {adminGraphqlRequest} from "./app.server";

/**
 * Creates a single metafield definition in Shopify.
 *
 * @param admin - Shopify Admin API client
 * @param name - Display name of the metafield
 * @param key - Key for accessing the metafield value
 * @param description - Description of what the metafield stores
 * @param type - Metafield type (e.g., 'json', 'list.url', etc.)
 * @param ownerType - The Shopify resource type the metafield is attached to
 * @returns The GraphQL response from Shopify
 * @throws Will throw an error if the API call fails
 */
export async function createMetafieldDefinition(
  admin: authenticateAdmin,
  name: string,
  key: string,
  description: string,
  type: string,
  ownerType: string
):
  Promise<Response> {
  try {
    return await admin.graphql(
      CREATE_METAFIELD_DEFINITION, {
        variables: {
          "definition": {
            name,
            namespace: "fasteditor_app",
            key,
            description,
            type,
            ownerType
          }
        }
      }
    )
  } catch (error) {
    console.error("[createMetafieldDefinition] Failed to create metafield definition:", error);
    throw error;
  }
}

/**
 * Sends a metafield mutation to the Shopify Admin API for the specified resource.
 *
 * @param admin - Shopify Admin API client
 * @param key - Metafield key
 * @param type - Metafield type
 * @param value - Metafield value as a string
 * @param ownerId - Shopify GID of the resource that owns the metafield
 * @returns A promise resolving to the `metafieldsSet` mutation response
 * @throws Error if the GraphQL request fails or returns an error response
 */
export async function setMetafield(
  admin: authenticateAdmin,
  key: string,
  type: string,
  value: string,
  ownerId: string,
): Promise<any> {
  return await adminGraphqlRequest(admin, METAFIELD_SET, {
    variables: {
      metafields: [
        {
          namespace: "fasteditor_app",
          key,
          type,
          value,
          ownerId,
        },
      ],
    },
  });
}
