import type {DashboardCoreLoader} from "../../routes/app.dashboard";
import {Fragment} from "react";
import {
  Box,
  EmptySearchResult,
  IndexFilters,
  IndexTable,
  InlineStack,
  Link,
  Text,
  Thumbnail
} from "@shopify/polaris";
import {ImageIcon} from "@shopify/polaris-icons";
import {useProductsTableControls} from "../../hooks/useProductsTableControls";
import {formatCurrency} from "../../utils/formatCurrency";

export const ProductsTable = (
  {
    products,
    pageInfo,
    shopName,
    shopSettings,
    productsLimit
  }: DashboardCoreLoader) => {

  const {
    mode,
    setMode,
    sortOptions,
    sortSelected,
    onSortChange,
    pagination,
    queryValue,
    onQueryChange,
    onQueryClear,
    tabs,
    selectedTab,
    setSelectedTab,
    loading
  } = useProductsTableControls({products, pageInfo, productsLimit});

  const resourceName = {
    singular: "product",
    plural: "products",
  };

  const emptyStateMarkup = (
    <EmptySearchResult
      title={"No products yet"}
      description={"Make sure your products have the fasteditor tag."}
      withIllustration
    />
  );

  const rows = products.map(({node: product}, productIndex) => {
      const productUrl = `https://admin.shopify.com/store/${shopName}/products/${product.legacyResourceId}`;

      return (
        <Fragment key={product.id}>
          <IndexTable.Row
            id={`Product-${productIndex}`}
            position={productIndex}
            rowType="data"
          >
            <IndexTable.Cell>
              <InlineStack blockAlign="center" gap="200">
                <Thumbnail
                  source={product.featuredMedia?.preview.image.url || ImageIcon}
                  alt={product.featuredMedia?.preview.image.altText || "default"}
                  size="small"
                />
                <Link removeUnderline url={productUrl} target="_top">
                  <strong>{product.title}</strong>
                </Link>
              </InlineStack>
            </IndexTable.Cell>
          </IndexTable.Row>

          {product.variants.nodes.map((variant, variantIndex) => {
            const variantUrl = `https://admin.shopify.com/store/${shopName}/products/${product.legacyResourceId}/variants/${variant.legacyResourceId}`;

            return (
              <IndexTable.Row
                key={`${product.id}-${variantIndex}`}
                id={`Variant-${variantIndex}`}
                position={variantIndex}
                rowType="child"
              >
                <IndexTable.Cell>
                  <InlineStack blockAlign="center" gap="200">
                    <Thumbnail
                      source={variant.image?.url || ImageIcon}
                      alt={variant.image?.altText || "default"}
                      size="small"
                    />
                    <Link removeUnderline url={variantUrl} target="_top">
                      {variant.title !== "Default Title" ? variant.title : product.title}
                    </Link>
                  </InlineStack>
                </IndexTable.Cell>
                <IndexTable.Cell>
                  <Text as="span">{variant.sku || "-"}</Text>
                </IndexTable.Cell>
                <IndexTable.Cell>
                  <Text as="span">
                    {variant.price
                      ? formatCurrency(parseFloat(variant.price), shopSettings.currency, shopSettings.country)
                      : "-"}
                  </Text>
                </IndexTable.Cell>
                <IndexTable.Cell>
                  <Text as="span" alignment="end" numeric>
                    {variant.inventoryQuantity ?? "-"}
                  </Text>
                </IndexTable.Cell>
              </IndexTable.Row>
            )
          })}
        </Fragment>
      )
    },
  );
  const onHandleCancel = () => {};

  return (
    <Box
      borderRadius="200"
      overflowY="hidden"
      overflowX="hidden"
      borderWidth="0165"
      borderColor="border-brand"
    >
      <IndexFilters
        tabs={tabs}
        selected={selectedTab}
        onSelect={setSelectedTab}
        sortOptions={sortOptions}
        sortSelected={sortSelected}
        onSort={onSortChange}
        queryValue={queryValue}
        queryPlaceholder="Searching in all"
        onQueryChange={onQueryChange}
        onQueryClear={onQueryClear}
        filters={[]}
        onClearAll={() => {}}
        mode={mode}
        setMode={setMode}
        canCreateNewView={false}
        cancelAction={{
          onAction: onHandleCancel,
          disabled: false,
          loading: false,
        }}
        loading={loading}
      />
      <IndexTable
        resourceName={resourceName}
        itemCount={products.length}
        emptyState={emptyStateMarkup}
        headings={[
          {title: "Product"},
          {title: "SKU"},
          {title: "Price",},
          {title: "Quantity", alignment: "end"},
        ]}
        selectable={false}
        pagination={{
          hasPrevious: pagination.hasPrevious,
          onPrevious: pagination.onPrevious,
          hasNext: pagination.hasNext,
          onNext: pagination.onNext,
        }}
      >
        {rows}
      </IndexTable>
    </Box>
  );
}
