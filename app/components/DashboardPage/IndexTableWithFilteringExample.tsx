import {
  IndexTable,
  LegacyCard,
  IndexFilters,
  useSetIndexFiltersMode,
  useIndexResourceState,
  Text,
  IndexFiltersMode,
  useBreakpoints,
} from '@shopify/polaris';
import type {IndexFiltersProps, TabProps} from '@shopify/polaris';
import {useState, useCallback, useEffect} from 'react';
import type {Products} from "../../types/products.types"

export const IndexTableWithFilteringExample = ({productsData}: Products) => {
  const productList = productsData.edges
  const [products, setProducts] = useState(productList);
  const {mode, setMode} = useSetIndexFiltersMode(IndexFiltersMode.Default);
  const [selectedTab, setSelectedTab] = useState(0);

  console.log("selectedTab", selectedTab)
  console.log("products", products)
  const tabItems = [
    'All',
    'Active',
    'Draft',
    'Archived'
  ]

  const onChangeTab = useCallback((item, index) => {
    if (index !== 0) {
      const test = productList.filter((i) => i.status.toLowerCase() === item.toLowerCase());
      setProducts(test)
    } else {
      setProducts(productList)
    }
  }, [])

  const tabs: TabProps[] = tabItems.map((item, index) => ({
    content: item,
    id: `${item}-${index}`,
    isLocked: index === 0,
    onAction: () => onChangeTab(item, index),
  }));


  const sortOptions: IndexFiltersProps['sortOptions'] = [
    {label: 'Product', value: 'title asc', directionLabel: 'A-Z'},
    {label: 'Product', value: 'title desc', directionLabel: 'Z-A'},
  ];
  const [sortSelected, setSortSelected] = useState(['title asc']);

  useEffect(() => {

  }, [sortSelected])

  console.log("sortSelected", sortSelected);

  // const onChangeSort = useCallback((item, index) => {
  // }, [])


  const onHandleCancel = () => {};

  const [queryValue, setQueryValue] = useState<string | undefined>(undefined);
  const handleQueryValueChange = useCallback(
    (value: string) => setQueryValue(value),
    [],
  );
  const handleQueryValueRemove = useCallback(() => setQueryValue(''), []);
  const handleFiltersClearAll = useCallback(() => {
    handleQueryValueRemove();
  }, [
    handleQueryValueRemove,
  ]);

  const resourceName = {
    singular: 'product',
    plural: 'products',
  };

  const {selectedResources, allResourcesSelected, handleSelectionChange} =
    useIndexResourceState(products);

  const rowMarkup = products.map(
    (
      {node: product},
      index,
    ) => (
      <IndexTable.Row
        id={product.id}
        key={product.id}
        selected={selectedResources.includes(product.id)}
        position={index}
      >
        <IndexTable.Cell>
          <Text variant="bodyMd" fontWeight="bold" as="span">
            {product.title}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>2312312321312</IndexTable.Cell>
        <IndexTable.Cell>
          <Text as="span">
            {/*{quantity ? `${quantity} in stock` : "Inventory not tracked"}*/}
            1
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Text as="span" alignment="end">
            {/*{price}*/}
            3232
          </Text>
        </IndexTable.Cell>
      </IndexTable.Row>
    ),
  );

  return (
    <LegacyCard>
      <IndexFilters
        tabs={tabs}
        selected={selectedTab}
        onSelect={setSelectedTab}
        sortOptions={sortOptions}
        sortSelected={sortSelected}
        onSort={setSortSelected}
        queryValue={queryValue}
        queryPlaceholder="Searching in all"
        onQueryChange={handleQueryValueChange}
        onQueryClear={() => setQueryValue('')}
        // primaryAction={primaryAction}
        cancelAction={{
          onAction: onHandleCancel,
          disabled: false,
          loading: false,
        }}
        canCreateNewView={false}
        filters={[]}
        onClearAll={handleFiltersClearAll}
        mode={mode}
        setMode={setMode}
      />
      <IndexTable
        condensed={useBreakpoints().smDown}
        resourceName={resourceName}
        itemCount={products.length}
        selectable={false}
        selectedItemsCount={
          allResourcesSelected ? 'All' : selectedResources.length
        }
        onSelectionChange={handleSelectionChange}
        headings={[
          {title: 'Product'},
          {title: 'SKU'},
          {title: 'Quantity'},
          {title: 'Price', alignment: 'end'},
        ]}
      >
        {rowMarkup}
      </IndexTable>
    </LegacyCard>
  );
}
