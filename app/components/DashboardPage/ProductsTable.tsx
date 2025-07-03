import {Fragment} from "react";
import {Box, IndexTable, InlineStack, Link, Text, Thumbnail} from '@shopify/polaris';
import {ImageIcon} from "@shopify/polaris-icons";
import type {DashboardLoader} from "./dashboard.types";
import {usePagination} from "../../hooks/usePagination";

export const ProductsTable = ({productsData, shopData, productsLimit}: DashboardLoader) => {
  const products = productsData.edges
  const pageInfo = productsData.pageInfo;

  const resourceName = {
    singular: 'product',
    plural: 'products',
  };

  const formatCurrency = (
    amount: number,
    currencyCode = shopData.currency,
    locale = shopData.locale
  ) => {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currencyCode,
    }).format(amount);
  };

  const rows = products.map(({node: product}, productIndex) => {
      const productUrl = `https://admin.shopify.com/store/${shopData.name}/products/${product.legacyResourceId}`;

      return (
        <Fragment key={product.id}>
          <IndexTable.Row
            rowType="data"
            id={`Product-${productIndex}`}
            position={productIndex}>
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
            const variantUrl = `https://admin.shopify.com/store/${shopData.name}/products/${product.legacyResourceId}/variants/${variant.legacyResourceId}`;
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
                      {variant.title}
                    </Link>
                  </InlineStack>
                </IndexTable.Cell>
                <IndexTable.Cell>
                  <Text as="span">{variant.sku || "-"}</Text>
                </IndexTable.Cell>
                <IndexTable.Cell>
                  <Text as="span">{variant.price ? formatCurrency(parseFloat(variant.price)) : "-"}</Text>
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

  const pagination = usePagination({pageInfo, productsLimit});

  return (
    <Box
      borderRadius="200"
      overflowY="hidden"
      overflowX="hidden"
      borderWidth="0165"
      borderColor="border-brand"
    >
      <IndexTable
        resourceName={resourceName}
        itemCount={products.length}
        headings={[
          {title: 'Product'},
          {title: 'SKU'},
          {title: 'Price',},
          {title: 'Quantity', alignment: 'end'},
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
