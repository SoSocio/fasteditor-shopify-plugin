import type {PageInfo, Product} from "../../types/products.types";
import {Fragment} from "react";
import {
  Box,
  EmptySearchResult,
  IndexFilters,
  IndexTable,
  InlineStack,
  Link,
  Text,
  Thumbnail,
  Button
} from "@shopify/polaris";
import {ImageIcon} from "@shopify/polaris-icons";
import {useTranslation} from "react-i18next";
import {useProductsTableControls} from "../../hooks/useProductsTableControls";
import {formatCurrency} from "../../utils/formatCurrency";
type PricingRuleTargetSelection = {
  targetId: string;
  targetTitle: string;
};

interface PricingRuleTargetsTableProps {
  products: { node: Product }[];
  pageInfo: PageInfo;
  shopName: string;
  shopSettings: {
    country: string;
    currency: string;
  };
  blockedTargetIds: string[];
  selectedTargetIds: string[];
  onToggleTarget: (value: PricingRuleTargetSelection) => void;
}

export const PricingRuleTargetsTable = ({
  products,
  pageInfo,
  shopName,
  shopSettings,
  blockedTargetIds,
  selectedTargetIds,
  onToggleTarget,
}: PricingRuleTargetsTableProps) => {
  const {t} = useTranslation();

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
  } = useProductsTableControls({pageInfo});

  const resourceName = {
    singular: t("dashboard-page.products-table.resource-name.singular"),
    plural: t("dashboard-page.products-table.resource-name.plural"),
  };

  const emptyStateMarkup = (
    <EmptySearchResult
      title={t("dashboard-page.products-table.empty-state.title")}
      description={t("dashboard-page.products-table.empty-state.description")}
      withIllustration
    />
  );

  const rows = products.map(({node: product}, productIndex) => {
    const productUrl = `https://admin.shopify.com/store/${shopName}/products/${product.legacyResourceId}`;
    const productSelected = selectedTargetIds.includes(product.id);

    return (
      <Fragment key={product.id}>
        <IndexTable.Row
          id={`Product-${productIndex}`}
          position={productIndex}
          rowType="data"
          selected={productSelected}
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
          <IndexTable.Cell>
            <Text as="span">-</Text>
          </IndexTable.Cell>
          <IndexTable.Cell>
            <Text as="span">-</Text>
          </IndexTable.Cell>
          <IndexTable.Cell>
            <Text as="span" alignment="end" numeric>
              -
            </Text>
          </IndexTable.Cell>
      <IndexTable.Cell>
        <Text as="span">-</Text>
      </IndexTable.Cell>
        </IndexTable.Row>

        {product.variants.nodes.map((variant, variantIndex) => {
          const variantUrl = `https://admin.shopify.com/store/${shopName}/products/${product.legacyResourceId}/variants/${variant.legacyResourceId}`;
          const variantSelected = selectedTargetIds.includes(variant.id);
          const variantBlocked = blockedTargetIds.includes(variant.id);
          const variantTitle = `${product.title} — ${variant.title}`;

          return (
            <IndexTable.Row
              key={`${product.id}-${variantIndex}`}
              id={`Variant-${variantIndex}`}
              position={variantIndex}
              rowType="child"
              selected={variantSelected}
            >
              <IndexTable.Cell>
                <InlineStack blockAlign="center" gap="200">
                  <Thumbnail
                    source={variant.image?.url || ImageIcon}
                    alt={variant.image?.altText || "default"}
                    size="small"
                  />
                  <Link removeUnderline url={variantUrl} target="_top">
                    {variant.title !== t("dashboard-page.products-table.default-variant-title")
                      ? variant.title
                      : product.title}
                  </Link>
                </InlineStack>
              </IndexTable.Cell>
              <IndexTable.Cell>
                <Text as="span">{variant.sku || "-"}</Text>
              </IndexTable.Cell>
              <IndexTable.Cell>
                <Text as="span">
                  {variant.price
                    ? formatCurrency(
                        parseFloat(variant.price),
                        shopSettings.currency,
                        shopSettings.country
                      )
                    : "-"}
                </Text>
              </IndexTable.Cell>
              <IndexTable.Cell>
                <Text as="span" alignment="end" numeric>
                  {variant.inventoryQuantity ?? "-"}
                </Text>
              </IndexTable.Cell>
              <IndexTable.Cell>
                <Button
                  size="slim"
                  variant={variantSelected ? "secondary" : "primary"}
                  tone={variantSelected ? "critical" : undefined}
                  disabled={!variantSelected && variantBlocked}
                  onClick={() =>
                    onToggleTarget({
                      targetId: variant.id,
                      targetTitle: `Variant: ${variantTitle}`,
                    })
                  }
                >
                  {variantSelected
                    ? t("pricing-rule-form.buttons.remove")
                    : t("pricing-rule-form.buttons.select")}
                </Button>
              </IndexTable.Cell>
            </IndexTable.Row>
          );
        })}
      </Fragment>
    );
  });

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
        queryPlaceholder={t("dashboard-page.products-table.search-placeholder")}
        onQueryChange={onQueryChange}
        onQueryClear={onQueryClear}
        filters={[]}
        onClearAll={() => {}}
        mode={mode}
        setMode={setMode}
        canCreateNewView={false}
        cancelAction={{
          onAction: (() => {}),
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
          {title: t("dashboard-page.products-table.headings.product")},
          {title: t("dashboard-page.products-table.headings.sku")},
          {title: t("dashboard-page.products-table.headings.price")},
          {title: t("dashboard-page.products-table.headings.quantity"), alignment: "end"},
          {title: t("pricing-rules-page.table.headings.actions")},
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
};
