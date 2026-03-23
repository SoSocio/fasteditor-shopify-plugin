import type {authenticateAdmin} from "../types/app.types";
import {adminGraphqlRequest} from "./app.server";

const FASTEDITOR_CART_TRANSFORM_HANDLE = "fasteditor-cart-transform";
const FASTEDITOR_CART_TRANSFORM_NAMESPACE = "fasteditor";
const FASTEDITOR_CART_TRANSFORM_KEY = "kind";
const FASTEDITOR_CART_TRANSFORM_VALUE = "pricing_line_update";

const GET_CART_TRANSFORM_STATUS = `#graphql
  query GetCartTransformStatus {
    shop {
      features {
        cartTransform {
          eligibleOperations {
            updateOperation
          }
        }
      }
    }
    cartTransforms(first: 25) {
      nodes {
        id
        functionId
        metafield(namespace: "${FASTEDITOR_CART_TRANSFORM_NAMESPACE}", key: "${FASTEDITOR_CART_TRANSFORM_KEY}") {
          value
        }
      }
    }
  }
`;

const CREATE_CART_TRANSFORM = `#graphql
  mutation CreateCartTransform(
    $functionHandle: String!
    $blockOnFailure: Boolean!
    $metafields: [MetafieldInput!]
  ) {
    cartTransformCreate(
      functionHandle: $functionHandle
      blockOnFailure: $blockOnFailure
      metafields: $metafields
    ) {
      cartTransform {
        id
        functionId
      }
      userErrors {
        code
        field
        message
      }
    }
  }
`;

interface CartTransformStatusResponse {
  shop: {
    features: {
      cartTransform: {
        eligibleOperations: {
          updateOperation: boolean;
        };
      };
    };
  };
  cartTransforms: {
    nodes: Array<{
      id: string;
      functionId: string;
      metafield: {
        value: string | null;
      } | null;
    }>;
  };
}

interface CartTransformCreateResponse {
  cartTransformCreate: {
    cartTransform: {
      id: string;
      functionId: string;
    } | null;
    userErrors: Array<{
      code?: string | null;
      field?: string[] | null;
      message: string;
    }>;
  };
}

export async function ensureFastEditorCartTransformReady(
  admin: authenticateAdmin
): Promise<boolean> {
  const status = await adminGraphqlRequest<CartTransformStatusResponse>(
    admin,
    GET_CART_TRANSFORM_STATUS
  );

  const updateOperationEligible = Boolean(
    status.shop.features.cartTransform.eligibleOperations.updateOperation
  );

  if (!updateOperationEligible) {
    return false;
  }

  const existingFastEditorTransform = (status.cartTransforms.nodes || []).find(
    (node) => node.metafield?.value === FASTEDITOR_CART_TRANSFORM_VALUE
  );

  if (existingFastEditorTransform) {
    return true;
  }

  const created = await adminGraphqlRequest<CartTransformCreateResponse>(
    admin,
    CREATE_CART_TRANSFORM,
    {
      variables: {
        functionHandle: FASTEDITOR_CART_TRANSFORM_HANDLE,
        blockOnFailure: false,
        metafields: [
          {
            namespace: FASTEDITOR_CART_TRANSFORM_NAMESPACE,
            key: FASTEDITOR_CART_TRANSFORM_KEY,
            type: "single_line_text_field",
            value: FASTEDITOR_CART_TRANSFORM_VALUE,
          },
        ],
      }
    }
  );

  const errors = created.cartTransformCreate?.userErrors || [];
  const alreadyRegistered = errors.some(
    (error) => error.code === "FUNCTION_ALREADY_REGISTERED"
  );

  if (alreadyRegistered) {
    return true;
  }

  if (errors.length > 0) {
    console.warn("[CartTransform] Failed to create FastEditor cart transform.", errors);
    return false;
  }

  return Boolean(created.cartTransformCreate?.cartTransform?.id);
}
