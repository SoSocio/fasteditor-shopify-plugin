import type {authenticateAdmin} from "../types/app.types";
import type {
  PricingRule,
  PricingRuleExtraCharge,
  PricingRuleFormValues,
  PricingRuleTargetOption
} from "../types/pricingRules.types";
import {adminGraphqlRequest} from "./app.server";
import {GET_PRICING_RULES} from "../graphql/pricingRules/getPricingRules";
import {GET_PRICING_RULE_BY_ID} from "../graphql/pricingRules/getPricingRuleById";
import {CREATE_PRICING_RULE_PRODUCT} from "../graphql/pricingRules/createPricingRuleProduct";
import {UPDATE_PRICING_RULE_PRODUCT} from "../graphql/pricingRules/updatePricingRuleProduct";
import {DELETE_PRICING_RULE_PRODUCT} from "../graphql/pricingRules/deletePricingRuleProduct";
import {SEARCH_PRODUCT_TARGETS} from "../graphql/pricingRules/searchProductTargets";
import {GET_PUBLICATIONS} from "../graphql/pricingRules/getPublications";
import {PUBLISH_PRICING_RULE_PRODUCT} from "../graphql/pricingRules/publishPricingRuleProduct";
import {UPDATE_PRICING_RULE_VARIANT} from "../graphql/pricingRules/updatePricingRuleVariant";

export const PRICING_RULE_TAG = "fasteditor_pricing_rule";
export const PRICING_RULE_PRODUCT_TYPE = "FastEditor Pricing Rule";
export const PRICING_RULE_NAMESPACE = "fasteditor_pricing_rule";

const RULE_KEYS = {
  description: "description",
  pricePerExtraPage: "price_per_extra_page",
  enabled: "enabled",
  targetType: "target_type",
  targetId: "target_id",
  targetTitle: "target_title",
};

type ShopifyMetafield = {
  key: string;
  value: string | null;
  type?: string | null;
};

type ShopifyProductVariant = {
  id: string;
  legacyResourceId: string;
  price?: string | null;
};

type ShopifyProduct = {
  id: string;
  legacyResourceId: string;
  title: string;
  status: string;
  variants: {
    nodes: ShopifyProductVariant[];
  };
  metafields: {
    nodes: ShopifyMetafield[];
  };
};

type ShopifyProductMutation = {
  id: string;
  legacyResourceId: string;
  status?: string | null;
  variants?: {
    nodes: ShopifyProductVariant[];
  } | null;
};

type GraphqlProductsResponse = {
  products: {
    edges: { node: ShopifyProduct }[];
  };
};

type GraphqlProductResponse = {
  product: ShopifyProduct | null;
};

type GraphqlProductMutationResponse = {
  productCreate?: {
    product: ShopifyProductMutation | null;
    userErrors: { field?: string[]; message: string }[];
  };
  productUpdate?: {
    product: ShopifyProductMutation | null;
    userErrors: { field?: string[]; message: string }[];
  };
  productDelete?: {
    deletedProductId: string | null;
    userErrors: { field?: string[]; message: string }[];
  };
};

type GraphqlVariantMutationResponse = {
  productVariantsBulkUpdate?: {
    productVariants?: ShopifyProductVariant[] | null;
    userErrors: { field?: string[]; message: string }[];
  };
};

type GraphqlPublicationsResponse = {
  publications: {
    nodes: {
      id: string;
      name?: string | null;
      catalog?: {
        id: string;
        title?: string | null;
      } | null;
    }[];
  };
};

type GraphqlPublishMutationResponse = {
  publishablePublish?: {
    publishable?: {
      publishedOnPublication?: boolean | null;
    } | null;
    userErrors: { field?: string[]; message: string }[];
  };
};

function normalizeMoneyValue(value: string | number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return "0.00";
  }

  return parsed.toFixed(2);
}

function normalizePositiveInteger(value: number | string | null | undefined) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 0;
  }

  return Math.floor(parsed);
}

async function updateProductStatus(
  admin: authenticateAdmin,
  productId: string,
  status: "ACTIVE" | "UNLISTED"
) {
  const data = await adminGraphqlRequest<GraphqlProductMutationResponse>(
    admin,
    UPDATE_PRICING_RULE_PRODUCT,
    {
      variables: {
        product: {
          id: productId,
          status,
        },
      },
    }
  );

  const errors = data.productUpdate?.userErrors || [];
  if (errors.length > 0) {
    throw new Error(errors.map((error) => error.message).join(", "));
  }
}

async function ensureProductUnlistedStatus(
  admin: authenticateAdmin,
  productId: string
) {
  await updateProductStatus(admin, productId, "UNLISTED");
}

async function syncPricingRuleVariant(
  admin: authenticateAdmin,
  productId: string,
  variantId: string,
  pricePerExtraPage: string
) {
  const data = await adminGraphqlRequest<GraphqlVariantMutationResponse>(
    admin,
    UPDATE_PRICING_RULE_VARIANT,
    {
      variables: {
        productId,
        variants: [
          {
            id: variantId,
            price: normalizeMoneyValue(pricePerExtraPage),
            taxable: false,
            inventoryItem: {
              tracked: false,
              requiresShipping: false,
            },
          },
        ],
      },
    }
  );

  const errors = data.productVariantsBulkUpdate?.userErrors || [];
  if (errors.length > 0) {
    throw new Error(errors.map((error) => error.message).join(", "));
  }
}

async function getOnlineStorePublicationId(admin: authenticateAdmin) {
  const data = await adminGraphqlRequest<GraphqlPublicationsResponse>(
    admin,
    GET_PUBLICATIONS,
    {
      variables: {
        first: 50,
      },
    }
  );

  const onlineStorePublication = data.publications.nodes.find((publication) => {
    const labels = [publication.name, publication.catalog?.title]
      .filter(Boolean)
      .map((value) => String(value).trim().toLowerCase());

    return labels.some((value) => value === "online store" || value.includes("online store"));
  });

  if (!onlineStorePublication?.id) {
    throw new Error("Online Store publication not found");
  }

  return onlineStorePublication.id;
}

async function publishProductToOnlineStore(
  admin: authenticateAdmin,
  productId: string,
  publicationId: string
) {
  const publish = async () => {
    const data = await adminGraphqlRequest<GraphqlPublishMutationResponse>(
      admin,
      PUBLISH_PRICING_RULE_PRODUCT,
      {
        variables: {
          id: productId,
          publicationId,
          input: [
            {
              publicationId,
            },
          ],
        },
      }
    );

    const errors = data.publishablePublish?.userErrors || [];
    if (errors.length > 0) {
      throw new Error(errors.map((error) => error.message).join(", "));
    }

    if (!data.publishablePublish?.publishable?.publishedOnPublication) {
      throw new Error("Product was not published to Online Store");
    }
  };

  try {
    await publish();
  } catch (error) {
    const message = error instanceof Error ? error.message.toLowerCase() : "";
    if (!message.includes("active")) {
      throw error;
    }

    await updateProductStatus(admin, productId, "ACTIVE");
    await publish();
    await ensureProductUnlistedStatus(admin, productId);
  }
}

type GraphqlSearchResponse = {
  products: {
    edges: {
      node: {
        id: string;
        title: string;
        variants: { nodes: { id: string; title: string }[] };
      };
    }[];
  };
};

function normalizeMetafields(metafields: ShopifyMetafield[]) {
  return metafields.reduce<Record<string, string>>((acc, metafield) => {
    if (metafield?.key) {
      acc[metafield.key] = metafield.value ?? "";
    }
    return acc;
  }, {});
}

function parseListValue(value: string | undefined): string[] {
  const trimmed = (value || "").trim();
  if (!trimmed) return [];
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item)).filter(Boolean);
      }
    } catch {
      return [trimmed];
    }
  }
  return [trimmed];
}

function mapPricingRule(product: ShopifyProduct): PricingRule {
  const meta = normalizeMetafields(product.metafields?.nodes || []);
  const targetIds = parseListValue(meta[RULE_KEYS.targetId]);
  const targetTitles = parseListValue(meta[RULE_KEYS.targetTitle]);
  const defaultVariant = product.variants?.nodes?.[0];

  return {
    id: product.id,
    legacyResourceId: product.legacyResourceId,
    title: product.title,
    description: meta[RULE_KEYS.description] || "",
    pricePerExtraPage: meta[RULE_KEYS.pricePerExtraPage] || "",
    enabled: (meta[RULE_KEYS.enabled] || "").toLowerCase() === "true",
    targetType: (meta[RULE_KEYS.targetType] as PricingRule["targetType"]) || "",
    targetIds,
    targetTitles,
    productVariantId: defaultVariant?.id || "",
    productVariantLegacyResourceId: defaultVariant?.legacyResourceId || "",
    productVariantPrice: defaultVariant?.price || "",
  };
}

function buildPricingRuleMetafields(values: PricingRuleFormValues) {
  return [
    {
      namespace: PRICING_RULE_NAMESPACE,
      key: RULE_KEYS.description,
      type: "multi_line_text_field",
      value: values.description || "",
    },
    {
      namespace: PRICING_RULE_NAMESPACE,
      key: RULE_KEYS.pricePerExtraPage,
      type: "number_decimal",
      value: values.pricePerExtraPage || "0",
    },
    {
      namespace: PRICING_RULE_NAMESPACE,
      key: RULE_KEYS.enabled,
      type: "boolean",
      value: values.enabled ? "true" : "false",
    },
    {
      namespace: PRICING_RULE_NAMESPACE,
      key: RULE_KEYS.targetType,
      type: "single_line_text_field",
      value: values.targetType || "",
    },
    {
      namespace: PRICING_RULE_NAMESPACE,
      key: RULE_KEYS.targetId,
      type: "single_line_text_field",
      value: JSON.stringify(values.targetIds || []),
    },
    {
      namespace: PRICING_RULE_NAMESPACE,
      key: RULE_KEYS.targetTitle,
      type: "single_line_text_field",
      value: JSON.stringify(values.targetTitles || []),
    },
  ];
}

function getProductGidFromLegacyId(legacyId: string) {
  return `gid://shopify/Product/${legacyId}`;
}

function getProductVariantGidFromLegacyId(legacyId: string) {
  return legacyId.startsWith("gid://shopify/ProductVariant/")
    ? legacyId
    : `gid://shopify/ProductVariant/${legacyId}`;
}

function buildSearchQuery(term: string) {
  const sanitized = term.replace(/"/g, "").trim();
  if (!sanitized) return null;
  return `title:*${sanitized}*`;
}

export async function getPricingRules(
  admin: authenticateAdmin
): Promise<PricingRule[]> {
  const data = await adminGraphqlRequest<GraphqlProductsResponse>(
    admin,
    GET_PRICING_RULES,
    {
      variables: {
        first: 100,
        query: `tag:${PRICING_RULE_TAG}`,
      },
    }
  );

  return data.products.edges.map(({node}) => mapPricingRule(node));
}

export async function getPricingRuleById(
  admin: authenticateAdmin,
  legacyId: string
): Promise<PricingRule | null> {
  const data = await adminGraphqlRequest<GraphqlProductResponse>(
    admin,
    GET_PRICING_RULE_BY_ID,
    {
      variables: {
        id: getProductGidFromLegacyId(legacyId),
      },
    }
  );

  if (!data.product) {
    return null;
  }

  return mapPricingRule(data.product);
}

export async function findPricingRuleByTargetVariantId(
  admin: authenticateAdmin,
  variantLegacyId: string
): Promise<PricingRule | null> {
  const targetVariantId = getProductVariantGidFromLegacyId(variantLegacyId);
  const rules = await getPricingRules(admin);

  return (
    rules.find((rule) =>
      rule.enabled
      && rule.targetType === "variant"
      && Boolean(rule.productVariantLegacyResourceId)
      && rule.targetIds.includes(targetVariantId)
    ) || null
  );
}

export async function resolvePricingRuleExtraCharge(
  admin: authenticateAdmin,
  variantLegacyId: string,
  extraPages: number,
  baseQuantity = 1
): Promise<PricingRuleExtraCharge | null> {
  const normalizedExtraPages = normalizePositiveInteger(extraPages);
  if (normalizedExtraPages <= 0) {
    return null;
  }

  const rule = await findPricingRuleByTargetVariantId(admin, variantLegacyId);
  if (!rule?.productVariantLegacyResourceId) {
    return null;
  }

  const pricePerExtraPage = normalizeMoneyValue(rule.pricePerExtraPage);
  if (
    rule.productVariantId
    && normalizeMoneyValue(rule.productVariantPrice || "0") !== pricePerExtraPage
  ) {
    await syncPricingRuleVariant(
      admin,
      rule.id,
      rule.productVariantId,
      pricePerExtraPage
    );
  }

  const quantity = normalizedExtraPages * Math.max(normalizePositiveInteger(baseQuantity), 1);
  const extraUnitAmount = normalizeMoneyValue(Number(pricePerExtraPage) * normalizedExtraPages);

  return {
    ruleId: rule.id,
    ruleTitle: rule.title,
    variantId: rule.productVariantLegacyResourceId,
    variantGid: rule.productVariantId,
    extraPages: normalizedExtraPages,
    quantity,
    pricePerExtraPage,
    extraUnitAmount,
    extraCost: normalizeMoneyValue(Number(pricePerExtraPage) * quantity),
  };
}

export async function createPricingRule(
  admin: authenticateAdmin,
  values: PricingRuleFormValues
) {
  const onlineStorePublicationId = await getOnlineStorePublicationId(admin);
  const data = await adminGraphqlRequest<GraphqlProductMutationResponse>(
    admin,
    CREATE_PRICING_RULE_PRODUCT,
    {
      variables: {
        product: {
          title: values.name,
          status: "UNLISTED",
          tags: [PRICING_RULE_TAG],
          productType: PRICING_RULE_PRODUCT_TYPE,
          metafields: buildPricingRuleMetafields(values),
        },
      },
    }
  );

  const errors = data.productCreate?.userErrors || [];
  if (errors.length > 0) {
    throw new Error(errors.map((error) => error.message).join(", "));
  }

  const createdProduct = data.productCreate?.product;
  if (createdProduct?.id) {
    const defaultVariant = createdProduct.variants?.nodes?.[0];
    if (defaultVariant?.id) {
      await syncPricingRuleVariant(
        admin,
        createdProduct.id,
        defaultVariant.id,
        values.pricePerExtraPage
      );
    }

    await publishProductToOnlineStore(admin, createdProduct.id, onlineStorePublicationId);

    if (createdProduct.status !== "UNLISTED") {
      await ensureProductUnlistedStatus(admin, createdProduct.id);
    }
  }

  return createdProduct;
}

export async function updatePricingRule(
  admin: authenticateAdmin,
  legacyId: string,
  values: PricingRuleFormValues
) {
  const onlineStorePublicationId = await getOnlineStorePublicationId(admin);
  const data = await adminGraphqlRequest<GraphqlProductMutationResponse>(
    admin,
    UPDATE_PRICING_RULE_PRODUCT,
    {
      variables: {
        product: {
          id: getProductGidFromLegacyId(legacyId),
          title: values.name,
          status: "UNLISTED",
          metafields: buildPricingRuleMetafields(values),
        },
      },
    }
  );

  const errors = data.productUpdate?.userErrors || [];
  if (errors.length > 0) {
    throw new Error(errors.map((error) => error.message).join(", "));
  }

  const updatedProduct = data.productUpdate?.product;
  if (updatedProduct?.id) {
    const defaultVariant = updatedProduct.variants?.nodes?.[0];
    if (defaultVariant?.id) {
      await syncPricingRuleVariant(
        admin,
        updatedProduct.id,
        defaultVariant.id,
        values.pricePerExtraPage
      );
    }

    await publishProductToOnlineStore(admin, updatedProduct.id, onlineStorePublicationId);

    if (updatedProduct.status !== "UNLISTED") {
      await ensureProductUnlistedStatus(admin, updatedProduct.id);
    }
  }

  return updatedProduct;
}

export async function deletePricingRule(
  admin: authenticateAdmin,
  legacyId: string
) {
  const data = await adminGraphqlRequest<GraphqlProductMutationResponse>(
    admin,
    DELETE_PRICING_RULE_PRODUCT,
    {
      variables: {
        input: {
          id: getProductGidFromLegacyId(legacyId),
        },
      },
    }
  );

  const errors = data.productDelete?.userErrors || [];
  if (errors.length > 0) {
    throw new Error(errors.map((error) => error.message).join(", "));
  }

  return data.productDelete?.deletedProductId;
}

export async function searchPricingRuleTargets(
  admin: authenticateAdmin,
  rawQuery: string
): Promise<PricingRuleTargetOption[]> {
  const query = buildSearchQuery(rawQuery);
  if (!query) return [];

  const data = await adminGraphqlRequest<GraphqlSearchResponse>(
    admin,
    SEARCH_PRODUCT_TARGETS,
    {
      variables: {
        first: 20,
        query: `tag:fasteditor -product_type:"Gift Card" ${query}`.trim(),
      },
    }
  );

  const results: PricingRuleTargetOption[] = [];

  data.products.edges.forEach(({node}) => {
    results.push({
      id: node.id,
      type: "product",
      title: node.title,
      label: `Product: ${node.title}`,
    });

    node.variants.nodes.forEach((variant) => {
      const label = `Variant: ${node.title} — ${variant.title}`;
      results.push({
        id: variant.id,
        type: "variant",
        title: label,
        label,
      });
    });
  });

  return results;
}
