import type {authenticateAdmin} from "../types/app.types";
import {CREATE_METAFIELD_DEFINITION} from "../graphql/metafields/createMetafieldDefinition";

export async function createOrderMetafieldDefinition(admin: authenticateAdmin) {
  try {
    await admin.graphql(
      CREATE_METAFIELD_DEFINITION, {
        variables: {
          "definition": {
            "name": "FastEditor Order Images",
            "namespace": "fasteditor",
            "key": "order_images",
            "description": "Images url of order item customized via FastEditor",
            "type": "list.url",
            "ownerType": "ORDER"
          }
        }
      }
    )
  } catch (error) {
    console.error("[createOrderMetafieldDefinition] Failed to create metafield definition:", error);
    throw error;
  }
}
