import type {PageInfo, Product} from "../../types/products.types";
import {Fragment, useMemo, useState} from "react";
import {
  Box,
  Checkbox,
  EmptySearchResult,
  IndexFilters,
  IndexTable,
  InlineStack,
  Link,
  Text,
  Thumbnail,
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
  onToggleProductTargets: (values: PricingRuleTargetSelection[]) => void;
}

export const PricingRuleTargetsTable = ({
  products,
  pageInfo,
  shopName,
  shopSettings,
  blockedTargetIds,
  selectedTargetIds,
  onToggleTarget,
  onToggleProductTargets,
}: PricingRuleTargetsTableProps) => {
  const {t} = useTranslation();
  const [selectionFilter, setSelectionFilter] = useState<"all" | "selected" | "unselected">("all");

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
    loading
  } = useProductsTableControls({pageInfo});

  const selectionFilterOptions = ["all", "selected", "unselected"] as const;
  const selectionTabs = [
    {
      id: "all",
      content: t("pricing-rule-form.target-filters.all", {defaultValue: "All"}),
      onAction: () => setSelectionFilter("all"),
    },
    {
      id: "selected",
      content: t("pricing-rule-form.target-filters.selected", {defaultValue: "Selected"}),
      onAction: () => setSelectionFilter("selected"),
    },
    {
      id: "unselected",
      content: t("pricing-rule-form.target-filters.unselected", {defaultValue: "Unselected"}),
      onAction: () => setSelectionFilter("unselected"),
    },
  ];

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

  const selectedTargetIdSet = useMemo(
    () => new Set(selectedTargetIds),
    [selectedTargetIds]
  );

  const productRows = products.map(({node: product}, productIndex) => {
    const productUrl = `https://admin.shopify.com/store/${shopName}/products/${product.legacyResourceId}`;
    const visibleVariants = product.variants.nodes.filter((variant) => {
      const isSelected = selectedTargetIdSet.has(variant.id);
      return selectionFilter === "all"
        || (selectionFilter === "selected" && isSelected)
        || (selectionFilter === "unselected" && !isSelected);
    });

    if (!visibleVariants.length) {
      return null;
    }

    const selectableProductTargets = product.variants.nodes
      .filter((variant) => !blockedTargetIds.includes(variant.id))
      .map((variant) => ({
        targetId: variant.id,
        targetTitle: `Variant: ${product.title} — ${variant.title}`,
      }));
    const selectedProductTargetCount = selectableProductTargets.filter((target) =>
      selectedTargetIdSet.has(target.targetId)
    ).length;
    const productChecked = selectedProductTargetCount === selectableProductTargets.length
      && selectableProductTargets.length > 0
      ? true
      : selectedProductTargetCount > 0
        ? "indeterminate"
        : false;

    return (
      <Fragment key={product.id}>
        <IndexTable.Row
          id={`Product-${productIndex}`}
          position={productIndex}
          rowType="data"
          selected={false}
        >
          <IndexTable.Cell>
            <InlineStack blockAlign="center" gap="200">
              <Checkbox
                label={product.title}
                labelHidden
                checked={productChecked}
                disabled={selectableProductTargets.length === 0}
                onChange={() => onToggleProductTargets(selectableProductTargets)}
              />
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
        </IndexTable.Row>

        {visibleVariants.map((variant, variantIndex) => {
          const variantUrl = `https://admin.shopify.com/store/${shopName}/products/${product.legacyResourceId}/variants/${variant.legacyResourceId}`;
          const variantBlocked = blockedTargetIds.includes(variant.id);
          const variantSelected = selectedTargetIdSet.has(variant.id);
          const variantTitle = `${product.title} — ${variant.title}`;

          return (
            <IndexTable.Row
              key={`${product.id}-${variantIndex}`}
              id={`Variant-${productIndex}-${variantIndex}`}
              position={variantIndex}
              rowType="child"
              selected={false}
            >
              <IndexTable.Cell>
                <Box paddingInlineStart="400">
                  <InlineStack blockAlign="center" gap="200">
                    <Checkbox
                      label={variantTitle}
                      labelHidden
                      checked={variantSelected}
                      disabled={variantBlocked && !variantSelected}
                      onChange={() =>
                        onToggleTarget({
                          targetId: variant.id,
                          targetTitle: `Variant: ${variantTitle}`,
                        })
                      }
                    />
                    <Thumbnail
                      source={variant.image?.url || product.featuredMedia?.preview.image.url || ImageIcon}
                      alt={variant.image?.altText || product.featuredMedia?.preview.image.altText || "default"}
                      size="small"
                    />
                    <Link removeUnderline url={variantUrl} target="_top">
                      {variant.title !== t("dashboard-page.products-table.default-variant-title")
                        ? variant.title
                        : product.title}
                    </Link>
                  </InlineStack>
                </Box>
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
            </IndexTable.Row>
          );
        })}
      </Fragment>
    );
  });

  const rows = productRows.filter(Boolean);

  return (
    <Box
      borderRadius="200"
      overflowY="hidden"
      overflowX="hidden"
      borderWidth="0165"
      borderColor="border-brand"
    >
      <IndexFilters
          tabs={selectionTabs}
          selected={selectionFilterOptions.indexOf(selectionFilter)}
          onSelect={(index) => setSelectionFilter(selectionFilterOptions[index])}
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
          itemCount={rows.length}
          emptyState={emptyStateMarkup}
          headings={[
            {title: t("dashboard-page.products-table.headings.product")},
            {title: t("dashboard-page.products-table.headings.sku")},
            {title: t("dashboard-page.products-table.headings.price")},
            {title: t("dashboard-page.products-table.headings.quantity"), alignment: "end"},
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
