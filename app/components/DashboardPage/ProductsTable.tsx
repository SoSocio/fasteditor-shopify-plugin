import {Box, IndexTable, Link, Text, Thumbnail} from '@shopify/polaris';
import {ImageIcon} from "@shopify/polaris-icons";
import {usePagination} from "../../hooks/usePagination";

export const ProductsTable = ({productsData, shop, limit}) => {

  const products = productsData.edges
  const pageInfo = productsData.pageInfo;

  const resourceName = {
    singular: 'product',
    plural: 'products',
  };

  const rows = products.map((product, index) => {
      const url = `https://admin.shopify.com/store/${shop}/products/${product.node.legacyResourceId}`
      return (
        <IndexTable.Row id={product.node.id} key={product.node.id} position={index}>
          <IndexTable.Cell>
            <Thumbnail
              source={product.node.featuredMedia.preview.image.url ? product.node.featuredMedia.preview.image.url : ImageIcon}
              alt={product.node.featuredMedia.preview.image.altText ? product.node.featuredMedia.preview.image.altText : "default"}
              size="small"
            />
          </IndexTable.Cell>
          <IndexTable.Cell>
            <Link removeUnderline url={url} target="_top">{product.node.title}</Link>
          </IndexTable.Cell>
          <IndexTable.Cell>
            <Text as="span">
              {product.node.status}
            </Text>
          </IndexTable.Cell>
          <IndexTable.Cell>
            <Text as="span" alignment="end" numeric>
              {product.node.variantsCount.count}
            </Text>
          </IndexTable.Cell>
        </IndexTable.Row>
      )
    },
  );

  const pagination = usePagination({pageInfo, limit});

  return (
    <Box borderRadius="200" overflowY="hidden" overflowX='hidden' borderWidth="0165" borderColor="border-brand">
      <IndexTable
        resourceName={resourceName}
        itemCount={products.length}
        headings={[
          {title: ""},
          {title: 'Product'},
          {title: 'Status'},
          {title: 'Variant count', alignment: 'end'},
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
