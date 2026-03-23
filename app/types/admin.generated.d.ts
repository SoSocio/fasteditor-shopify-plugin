/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable eslint-comments/no-unlimited-disable */
/* eslint-disable */
import type * as AdminTypes from './admin.types';

export type ActiveSubscriptionsFragmentFragment = { activeSubscriptions: Array<(
    Pick<AdminTypes.AppSubscription, 'id' | 'name' | 'status' | 'createdAt' | 'currentPeriodEnd' | 'trialDays'>
    & { lineItems: Array<(
      Pick<AdminTypes.AppSubscriptionLineItem, 'id'>
      & { plan: { pricingDetails: (
          { __typename: 'AppRecurringPricing' }
          & { price: Pick<AdminTypes.MoneyV2, 'amount' | 'currencyCode'> }
        ) | (
          { __typename: 'AppUsagePricing' }
          & Pick<AdminTypes.AppUsagePricing, 'terms'>
          & { balanceUsed: Pick<AdminTypes.MoneyV2, 'amount' | 'currencyCode'>, cappedAmount: Pick<AdminTypes.MoneyV2, 'amount' | 'currencyCode'> }
        ) } }
    )> }
  )> };

export type AppInstallationIdFragmentFragment = Pick<AdminTypes.AppInstallation, 'id'>;

export type GetAppInfoByKeyQueryVariables = AdminTypes.Exact<{
  clientId: AdminTypes.Scalars['String']['input'];
}>;


export type GetAppInfoByKeyQuery = { appByKey?: AdminTypes.Maybe<Pick<AdminTypes.App, 'title' | 'handle'>> };

export type GetAppMetafieldQueryVariables = AdminTypes.Exact<{
  namespace: AdminTypes.Scalars['String']['input'];
  key: AdminTypes.Scalars['String']['input'];
}>;


export type GetAppMetafieldQuery = { currentAppInstallation: { metafield?: AdminTypes.Maybe<Pick<AdminTypes.Metafield, 'value'>> } };

export type AppUsageRecordCreateMutationVariables = AdminTypes.Exact<{
  description: AdminTypes.Scalars['String']['input'];
  price: AdminTypes.MoneyInput;
  subscriptionLineItemId: AdminTypes.Scalars['ID']['input'];
}>;


export type AppUsageRecordCreateMutation = { appUsageRecordCreate?: AdminTypes.Maybe<{ userErrors: Array<Pick<AdminTypes.UserError, 'field' | 'message'>>, appUsageRecord?: AdminTypes.Maybe<Pick<AdminTypes.AppUsageRecord, 'id'>> }> };

export type CreateMetafieldDefinitionMutationVariables = AdminTypes.Exact<{
  definition: AdminTypes.MetafieldDefinitionInput;
}>;


export type CreateMetafieldDefinitionMutation = { metafieldDefinitionCreate?: AdminTypes.Maybe<{ createdDefinition?: AdminTypes.Maybe<Pick<AdminTypes.MetafieldDefinition, 'id' | 'name'>>, userErrors: Array<Pick<AdminTypes.MetafieldDefinitionCreateUserError, 'field' | 'message' | 'code'>> }> };

export type MetafieldsSetMutationVariables = AdminTypes.Exact<{
  metafields: Array<AdminTypes.MetafieldsSetInput> | AdminTypes.MetafieldsSetInput;
}>;


export type MetafieldsSetMutation = { metafieldsSet?: AdminTypes.Maybe<{ metafields?: AdminTypes.Maybe<Array<Pick<AdminTypes.Metafield, 'id' | 'namespace' | 'key'>>>, userErrors: Array<Pick<AdminTypes.MetafieldsSetUserError, 'field' | 'message'>> }> };

export type UpdateOrderTagsMutationVariables = AdminTypes.Exact<{
  input: AdminTypes.OrderInput;
}>;


export type UpdateOrderTagsMutation = { orderUpdate?: AdminTypes.Maybe<{ order?: AdminTypes.Maybe<(
      Pick<AdminTypes.Order, 'id' | 'tags'>
      & { metafield?: AdminTypes.Maybe<Pick<AdminTypes.Metafield, 'value'>> }
    )>, userErrors: Array<Pick<AdminTypes.UserError, 'field' | 'message'>> }> };

export type CreatePricingRuleProductMutationVariables = AdminTypes.Exact<{
  product: AdminTypes.ProductCreateInput;
}>;


export type CreatePricingRuleProductMutation = { productCreate?: AdminTypes.Maybe<{ product?: AdminTypes.Maybe<(
      Pick<AdminTypes.Product, 'id' | 'legacyResourceId' | 'status'>
      & { variants: { nodes: Array<Pick<AdminTypes.ProductVariant, 'id' | 'legacyResourceId' | 'price'>> } }
    )>, userErrors: Array<Pick<AdminTypes.UserError, 'field' | 'message'>> }> };

export type DeletePricingRuleProductMutationVariables = AdminTypes.Exact<{
  input: AdminTypes.ProductDeleteInput;
}>;


export type DeletePricingRuleProductMutation = { productDelete?: AdminTypes.Maybe<(
    Pick<AdminTypes.ProductDeletePayload, 'deletedProductId'>
    & { userErrors: Array<Pick<AdminTypes.UserError, 'field' | 'message'>> }
  )> };

export type GetPricingRuleByIdQueryVariables = AdminTypes.Exact<{
  id: AdminTypes.Scalars['ID']['input'];
}>;


export type GetPricingRuleByIdQuery = { product?: AdminTypes.Maybe<(
    Pick<AdminTypes.Product, 'id' | 'legacyResourceId' | 'title' | 'status'>
    & { variants: { nodes: Array<Pick<AdminTypes.ProductVariant, 'id' | 'legacyResourceId' | 'price'>> }, metafields: { nodes: Array<Pick<AdminTypes.Metafield, 'key' | 'value' | 'type'>> } }
  )> };

export type GetPricingRulesQueryVariables = AdminTypes.Exact<{
  first: AdminTypes.Scalars['Int']['input'];
  query: AdminTypes.Scalars['String']['input'];
}>;


export type GetPricingRulesQuery = { products: { edges: Array<{ node: (
        Pick<AdminTypes.Product, 'id' | 'legacyResourceId' | 'title' | 'status'>
        & { variants: { nodes: Array<Pick<AdminTypes.ProductVariant, 'id' | 'legacyResourceId' | 'price'>> }, metafields: { nodes: Array<Pick<AdminTypes.Metafield, 'key' | 'value' | 'type'>> } }
      ) }> } };

export type GetPublicationsQueryVariables = AdminTypes.Exact<{
  first: AdminTypes.Scalars['Int']['input'];
}>;


export type GetPublicationsQuery = { publications: { nodes: Array<(
      Pick<AdminTypes.Publication, 'id' | 'name'>
      & { catalog?: AdminTypes.Maybe<Pick<AdminTypes.AppCatalog, 'id' | 'title'> | Pick<AdminTypes.CompanyLocationCatalog, 'id' | 'title'> | Pick<AdminTypes.MarketCatalog, 'id' | 'title'>> }
    )> } };

export type PublishPricingRuleProductMutationVariables = AdminTypes.Exact<{
  id: AdminTypes.Scalars['ID']['input'];
  input: Array<AdminTypes.PublicationInput> | AdminTypes.PublicationInput;
  publicationId: AdminTypes.Scalars['ID']['input'];
}>;


export type PublishPricingRuleProductMutation = { publishablePublish?: AdminTypes.Maybe<{ publishable?: AdminTypes.Maybe<Pick<AdminTypes.Collection, 'publishedOnPublication'> | Pick<AdminTypes.Product, 'publishedOnPublication'>>, userErrors: Array<Pick<AdminTypes.UserError, 'field' | 'message'>> }> };

export type SearchProductTargetsQueryVariables = AdminTypes.Exact<{
  first: AdminTypes.Scalars['Int']['input'];
  query: AdminTypes.Scalars['String']['input'];
}>;


export type SearchProductTargetsQuery = { products: { edges: Array<{ node: (
        Pick<AdminTypes.Product, 'id' | 'legacyResourceId' | 'title'>
        & { variants: { nodes: Array<Pick<AdminTypes.ProductVariant, 'id' | 'legacyResourceId' | 'title'>> } }
      ) }> } };

export type UpdatePricingRuleProductMutationVariables = AdminTypes.Exact<{
  product: AdminTypes.ProductUpdateInput;
}>;


export type UpdatePricingRuleProductMutation = { productUpdate?: AdminTypes.Maybe<{ product?: AdminTypes.Maybe<(
      Pick<AdminTypes.Product, 'id' | 'legacyResourceId' | 'status'>
      & { variants: { nodes: Array<Pick<AdminTypes.ProductVariant, 'id' | 'legacyResourceId' | 'price'>> } }
    )>, userErrors: Array<Pick<AdminTypes.UserError, 'field' | 'message'>> }> };

export type UpdatePricingRuleVariantMutationVariables = AdminTypes.Exact<{
  productId: AdminTypes.Scalars['ID']['input'];
  variants: Array<AdminTypes.ProductVariantsBulkInput> | AdminTypes.ProductVariantsBulkInput;
}>;


export type UpdatePricingRuleVariantMutation = { productVariantsBulkUpdate?: AdminTypes.Maybe<{ productVariants?: AdminTypes.Maybe<Array<Pick<AdminTypes.ProductVariant, 'id' | 'legacyResourceId' | 'price'>>>, userErrors: Array<Pick<AdminTypes.ProductVariantsBulkUpdateUserError, 'field' | 'message'>> }> };

export type GetProductVariantSkuQueryVariables = AdminTypes.Exact<{
  id: AdminTypes.Scalars['ID']['input'];
}>;


export type GetProductVariantSkuQuery = { productVariant?: AdminTypes.Maybe<Pick<AdminTypes.ProductVariant, 'id' | 'sku'>> };

export type GetProductsQueryVariables = AdminTypes.Exact<{
  first?: AdminTypes.InputMaybe<AdminTypes.Scalars['Int']['input']>;
  after?: AdminTypes.InputMaybe<AdminTypes.Scalars['String']['input']>;
  last?: AdminTypes.InputMaybe<AdminTypes.Scalars['Int']['input']>;
  before?: AdminTypes.InputMaybe<AdminTypes.Scalars['String']['input']>;
  query?: AdminTypes.InputMaybe<AdminTypes.Scalars['String']['input']>;
  sortKey?: AdminTypes.InputMaybe<AdminTypes.ProductSortKeys>;
  reverse?: AdminTypes.InputMaybe<AdminTypes.Scalars['Boolean']['input']>;
}>;


export type GetProductsQuery = { products: { edges: Array<(
      Pick<AdminTypes.ProductEdge, 'cursor'>
      & { node: (
        Pick<AdminTypes.Product, 'id' | 'title' | 'legacyResourceId' | 'status' | 'productType' | 'tags'>
        & { featuredMedia?: AdminTypes.Maybe<{ preview?: AdminTypes.Maybe<{ image?: AdminTypes.Maybe<Pick<AdminTypes.Image, 'altText' | 'url'>> }> }>, variants: { nodes: Array<(
            Pick<AdminTypes.ProductVariant, 'id' | 'legacyResourceId' | 'title' | 'sku' | 'price' | 'inventoryQuantity'>
            & { image?: AdminTypes.Maybe<Pick<AdminTypes.Image, 'altText' | 'url'>> }
          )> } }
      ) }
    )>, pageInfo: Pick<AdminTypes.PageInfo, 'startCursor' | 'endCursor' | 'hasNextPage' | 'hasPreviousPage'> } };

export type GetShopInfoQueryVariables = AdminTypes.Exact<{ [key: string]: never; }>;


export type GetShopInfoQuery = { shop: (
    Pick<AdminTypes.Shop, 'name' | 'myshopifyDomain' | 'currencyCode'>
    & { billingAddress: Pick<AdminTypes.ShopAddress, 'countryCodeV2'> }
  ) };

export type GetShopLocalesQueryVariables = AdminTypes.Exact<{ [key: string]: never; }>;


export type GetShopLocalesQuery = { shopLocales: Array<Pick<AdminTypes.ShopLocale, 'locale' | 'primary' | 'published'>> };

export type GetCurrentAppInstallationQueryVariables = AdminTypes.Exact<{ [key: string]: never; }>;


export type GetCurrentAppInstallationQuery = { currentAppInstallation: Pick<AdminTypes.AppInstallation, 'id'> };

export type AllAppSubscriptionsQueryVariables = AdminTypes.Exact<{ [key: string]: never; }>;


export type AllAppSubscriptionsQuery = { currentAppInstallation: { allSubscriptions: { nodes: Array<(
        Pick<AdminTypes.AppSubscription, 'createdAt' | 'currentPeriodEnd' | 'id' | 'name' | 'returnUrl' | 'status' | 'test' | 'trialDays'>
        & { lineItems: Array<(
          Pick<AdminTypes.AppSubscriptionLineItem, 'id'>
          & { plan: { pricingDetails: (
              { __typename: 'AppRecurringPricing' }
              & { price: Pick<AdminTypes.MoneyV2, 'amount' | 'currencyCode'> }
            ) | (
              { __typename: 'AppUsagePricing' }
              & Pick<AdminTypes.AppUsagePricing, 'terms'>
              & { balanceUsed: Pick<AdminTypes.MoneyV2, 'amount' | 'currencyCode'>, cappedAmount: Pick<AdminTypes.MoneyV2, 'amount' | 'currencyCode'> }
            ) } }
        )> }
      )> } } };

export type ActiveSubscriptionsQueryVariables = AdminTypes.Exact<{ [key: string]: never; }>;


export type ActiveSubscriptionsQuery = { currentAppInstallation: { activeSubscriptions: Array<(
      Pick<AdminTypes.AppSubscription, 'id' | 'name' | 'status' | 'createdAt' | 'currentPeriodEnd' | 'trialDays'>
      & { lineItems: Array<(
        Pick<AdminTypes.AppSubscriptionLineItem, 'id'>
        & { plan: { pricingDetails: (
            { __typename: 'AppRecurringPricing' }
            & { price: Pick<AdminTypes.MoneyV2, 'amount' | 'currencyCode'> }
          ) | (
            { __typename: 'AppUsagePricing' }
            & Pick<AdminTypes.AppUsagePricing, 'terms'>
            & { balanceUsed: Pick<AdminTypes.MoneyV2, 'amount' | 'currencyCode'>, cappedAmount: Pick<AdminTypes.MoneyV2, 'amount' | 'currencyCode'> }
          ) } }
      )> }
    )> } };

interface GeneratedQueryTypes {
  "\n  #graphql\n  query getAppInfoByKey($clientId: String!) {\n    appByKey(apiKey: $clientId) {\n      title\n      handle\n    }\n  }\n": {return: GetAppInfoByKeyQuery, variables: GetAppInfoByKeyQueryVariables},
  "\n  #graphql\n  query GetAppMetafield($namespace: String!, $key: String!) {\n    currentAppInstallation {\n      metafield(namespace: $namespace, key: $key) {\n        value\n      }\n    }\n  }\n": {return: GetAppMetafieldQuery, variables: GetAppMetafieldQueryVariables},
  "\n  #graphql\n  query GetPricingRuleById($id: ID!) {\n    product(id: $id) {\n      id\n      legacyResourceId\n      title\n      status\n      variants(first: 1) {\n        nodes {\n          id\n          legacyResourceId\n          price\n        }\n      }\n      metafields(first: 20, namespace: \"fasteditor_pricing_rule\") {\n        nodes {\n          key\n          value\n          type\n        }\n      }\n    }\n  }\n": {return: GetPricingRuleByIdQuery, variables: GetPricingRuleByIdQueryVariables},
  "\n  #graphql\n  query GetPricingRules($first: Int!, $query: String!) {\n    products(first: $first, query: $query, sortKey: TITLE) {\n      edges {\n        node {\n          id\n          legacyResourceId\n          title\n          status\n          variants(first: 1) {\n            nodes {\n              id\n              legacyResourceId\n              price\n            }\n          }\n          metafields(first: 20, namespace: \"fasteditor_pricing_rule\") {\n            nodes {\n              key\n              value\n              type\n            }\n          }\n        }\n      }\n    }\n  }\n": {return: GetPricingRulesQuery, variables: GetPricingRulesQueryVariables},
  "\n  #graphql\n  query GetPublications($first: Int!) {\n    publications(first: $first) {\n      nodes {\n        id\n        name\n        catalog {\n          id\n          title\n        }\n      }\n    }\n  }\n": {return: GetPublicationsQuery, variables: GetPublicationsQueryVariables},
  "\n  #graphql\n  query SearchProductTargets($first: Int!, $query: String!) {\n    products(first: $first, query: $query, sortKey: TITLE) {\n      edges {\n        node {\n          id\n          legacyResourceId\n          title\n          variants(first: 30) {\n            nodes {\n              id\n              legacyResourceId\n              title\n            }\n          }\n        }\n      }\n    }\n  }\n": {return: SearchProductTargetsQuery, variables: SearchProductTargetsQueryVariables},
  "\n  #graphql\n  query GetProductVariantSku($id: ID!) {\n    productVariant(id: $id) {\n      id\n      sku\n    }\n  }": {return: GetProductVariantSkuQuery, variables: GetProductVariantSkuQueryVariables},
  "\n  #graphql\n  query GetProducts(\n    $first: Int\n    $after: String\n    $last: Int\n    $before: String\n    $query: String\n    $sortKey: ProductSortKeys\n    $reverse: Boolean\n  ) {\n    products(\n      first: $first\n      after: $after\n      last: $last\n      before: $before\n      query: $query\n      sortKey: $sortKey\n      reverse: $reverse\n    ) {\n      edges {\n        cursor\n        node {\n          id\n          title\n          legacyResourceId\n          status\n          productType\n          tags\n\n          featuredMedia {\n            preview {\n              image {\n                altText\n                url\n              }\n            }\n          }\n\n          variants(first: 30) {\n            nodes {\n              id\n              legacyResourceId\n              title\n              sku\n              price\n              inventoryQuantity\n              image {\n                altText\n                url\n              }\n            }\n          }\n        }\n      }\n\n      pageInfo {\n        startCursor\n        endCursor\n        hasNextPage\n        hasPreviousPage\n      }\n    }\n  }\n": {return: GetProductsQuery, variables: GetProductsQueryVariables},
  "\n  #graphql\n  query GetShopInfo {\n    shop {\n      name\n      myshopifyDomain\n      currencyCode\n      billingAddress {\n        countryCodeV2\n      }\n    }\n  }": {return: GetShopInfoQuery, variables: GetShopInfoQueryVariables},
  "\n  #graphql\n  query GetShopLocales {\n    shopLocales {\n      locale\n      primary\n      published\n    }\n  }": {return: GetShopLocalesQuery, variables: GetShopLocalesQueryVariables},
  "\n    #graphql\n    query GetCurrentAppInstallation {\n      currentAppInstallation {\n        ...AppInstallationIdFragment\n      }\n    }\n    \n  #graphql\n  fragment AppInstallationIdFragment on AppInstallation {\n    id\n  }\n\n  ": {return: GetCurrentAppInstallationQuery, variables: GetCurrentAppInstallationQueryVariables},
  "\n    #graphql\n    query AllAppSubscriptions {\n      currentAppInstallation {\n        allSubscriptions(first: 150) {\n          nodes {\n            createdAt\n            currentPeriodEnd\n            id\n            lineItems {\n              id\n              plan {\n                pricingDetails {\n                  __typename\n                  ... on AppRecurringPricing {\n                    price {\n                      amount\n                      currencyCode\n                    }\n                  }\n                  ... on AppUsagePricing {\n                    balanceUsed {\n                      amount\n                      currencyCode\n                    }\n                    cappedAmount {\n                      amount\n                      currencyCode\n                    }\n                    terms\n                  }\n                }\n              }\n            }\n            name\n            returnUrl\n            status\n            test\n            trialDays\n          }\n        }\n      }\n    }\n  ": {return: AllAppSubscriptionsQuery, variables: AllAppSubscriptionsQueryVariables},
  "\n    #graphql\n    query ActiveSubscriptions {\n      currentAppInstallation {\n        ...ActiveSubscriptionsFragment\n      }\n    }\n    \n  #graphql\n  fragment ActiveSubscriptionsFragment on AppInstallation {\n    activeSubscriptions {\n      id\n      name\n      status\n      createdAt\n      currentPeriodEnd\n      trialDays\n      lineItems {\n        id\n        plan {\n          pricingDetails {\n            __typename\n            ... on AppRecurringPricing {\n              price {\n                amount\n                currencyCode\n              }\n            }\n            ... on AppUsagePricing {\n              balanceUsed {\n                amount\n                currencyCode\n              }\n              cappedAmount {\n                amount\n                currencyCode\n              }\n              terms\n            }\n          }\n        }\n      }\n    }\n  }\n\n  ": {return: ActiveSubscriptionsQuery, variables: ActiveSubscriptionsQueryVariables},
}

interface GeneratedMutationTypes {
  "\n  #graphql\n  mutation appUsageRecordCreate($description: String!, $price: MoneyInput!, $subscriptionLineItemId: ID!) {\n    appUsageRecordCreate(description: $description, price: $price, subscriptionLineItemId: $subscriptionLineItemId) {\n      userErrors {\n        field\n        message\n      }\n      appUsageRecord {\n        id\n      }\n    }\n  }\n": {return: AppUsageRecordCreateMutation, variables: AppUsageRecordCreateMutationVariables},
  "\n  #graphql\n  mutation CreateMetafieldDefinition($definition: MetafieldDefinitionInput!) {\n    metafieldDefinitionCreate(definition: $definition) {\n      createdDefinition {\n        id\n        name\n      }\n      userErrors {\n        field\n        message\n        code\n      }\n    }\n  }\n": {return: CreateMetafieldDefinitionMutation, variables: CreateMetafieldDefinitionMutationVariables},
  "\n  #graphql\n  mutation MetafieldsSet($metafields: [MetafieldsSetInput!]!) {\n    metafieldsSet(metafields: $metafields) {\n      metafields {\n        id\n        namespace\n        key\n      }\n      userErrors {\n        field\n        message\n      }\n    }\n  }\n": {return: MetafieldsSetMutation, variables: MetafieldsSetMutationVariables},
  "\n  #graphql\n  mutation UpdateOrderTags($input: OrderInput!) {\n    orderUpdate(input: $input) {\n      order {\n        id\n        tags\n        metafield(namespace: \"fasteditor_app\", key: \"processing_results\") {\n          value\n        }\n      }\n      userErrors {\n        field\n        message\n      }\n    }\n  }\n": {return: UpdateOrderTagsMutation, variables: UpdateOrderTagsMutationVariables},
  "\n  #graphql\n  mutation CreatePricingRuleProduct($product: ProductCreateInput!) {\n    productCreate(product: $product) {\n      product {\n        id\n        legacyResourceId\n        status\n        variants(first: 1) {\n          nodes {\n            id\n            legacyResourceId\n            price\n          }\n        }\n      }\n      userErrors {\n        field\n        message\n      }\n    }\n  }\n": {return: CreatePricingRuleProductMutation, variables: CreatePricingRuleProductMutationVariables},
  "\n  #graphql\n  mutation DeletePricingRuleProduct($input: ProductDeleteInput!) {\n    productDelete(input: $input) {\n      deletedProductId\n      userErrors {\n        field\n        message\n      }\n    }\n  }\n": {return: DeletePricingRuleProductMutation, variables: DeletePricingRuleProductMutationVariables},
  "\n  #graphql\n  mutation PublishPricingRuleProduct($id: ID!, $input: [PublicationInput!]!, $publicationId: ID!) {\n    publishablePublish(id: $id, input: $input) {\n      publishable {\n        publishedOnPublication(publicationId: $publicationId)\n      }\n      userErrors {\n        field\n        message\n      }\n    }\n  }\n": {return: PublishPricingRuleProductMutation, variables: PublishPricingRuleProductMutationVariables},
  "\n  #graphql\n  mutation UpdatePricingRuleProduct($product: ProductUpdateInput!) {\n    productUpdate(product: $product) {\n      product {\n        id\n        legacyResourceId\n        status\n        variants(first: 1) {\n          nodes {\n            id\n            legacyResourceId\n            price\n          }\n        }\n      }\n      userErrors {\n        field\n        message\n      }\n    }\n  }\n": {return: UpdatePricingRuleProductMutation, variables: UpdatePricingRuleProductMutationVariables},
  "\n  #graphql\n  mutation UpdatePricingRuleVariant(\n    $productId: ID!\n    $variants: [ProductVariantsBulkInput!]!\n  ) {\n    productVariantsBulkUpdate(productId: $productId, variants: $variants) {\n      productVariants {\n        id\n        legacyResourceId\n        price\n      }\n      userErrors {\n        field\n        message\n      }\n    }\n  }\n": {return: UpdatePricingRuleVariantMutation, variables: UpdatePricingRuleVariantMutationVariables},
}
declare module '@shopify/admin-api-client' {
  type InputMaybe<T> = AdminTypes.InputMaybe<T>;
  interface AdminQueries extends GeneratedQueryTypes {}
  interface AdminMutations extends GeneratedMutationTypes {}
}
