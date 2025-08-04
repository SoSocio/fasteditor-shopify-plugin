import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {useNavigate} from "react-router-dom";
import {
  IndexFiltersMode,
  type IndexFiltersProps,
  type TabProps,
  useSetIndexFiltersMode
} from "@shopify/polaris";
import {useLocation, useNavigation} from "@remix-run/react";
import type {Product} from "../types/products.types";

interface PageInfo {
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  startCursor: string | null;
  endCursor: string | null;
}

interface ProductsTableControls {
  products: { node: Product; }[];
  pageInfo: PageInfo;
  productsLimit: number;
}

/**
 * Custom hook for handling pagination, sorting, and search filtering of products.
 * @param productList - Array of product nodes.
 * @param pageInfo - Shopify GraphQL page info.
 * @param productsLimit - Default limit of products per page.
 * @returns Pagination, sorting, and search state handlers.
 */
export const useProductsTableControls = (
  {
    products,
    pageInfo,
    productsLimit
  }: ProductsTableControls) => {
  const navigate = useNavigate();
  const location = useLocation();
  const skipQueryEffectRef = useRef(false);
  const navigation = useNavigation();
  const loading = navigation.state === "loading";

  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const initialSort = searchParams.get("order") || "title asc";
  const initialQuery = searchParams.get("query") || "";
  const initialSelectedView = searchParams.get("selectedView") || "all";
  const limit = searchParams.get("limit") || productsLimit;

  const {mode, setMode} = useSetIndexFiltersMode(IndexFiltersMode.Default);

  const tabItems = [
    'All',
    'Active',
    'Draft',
    'Archived'
  ]

  const [selectedTab, setSelectedTab] = useState(
    tabItems.findIndex((tab) => tab.toLowerCase() === initialSelectedView.toLowerCase()) || 0
  );

  const onChangeTab = useCallback((item: string, index: number) => {
    skipQueryEffectRef.current = true;
    setSelectedTab(index);

    const params = new URLSearchParams(location.search);
    params.set("selectedView", item.toLowerCase());
    params.delete("rel");
    params.delete("cursor");
    navigate({search: params.toString()});
  }, [location.search, navigate]);

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

  const [sortSelected, setSortSelected] = useState<string[]>([initialSort]);
  const [queryValue, setQueryValue] = useState(initialQuery);

  /**
   * Updates URL when sort option is changed.
   *
   * @param newSort - Selected sort values.
   */
  const onSortChange = useCallback(
    (newSort: string[]) => {
      skipQueryEffectRef.current = true;
      setSortSelected(newSort);

      const params = new URLSearchParams(location.search);
      params.set("order", newSort[0]);
      params.delete("rel");
      params.delete("cursor");

      navigate({search: params.toString()});
    },
    [navigate, location.search]
  );

  /**
   * Updates URL with new search query (debounced).
   */
  useEffect(() => {
    if (skipQueryEffectRef.current) {
      skipQueryEffectRef.current = false;
      return;
    }

    const timeout = setTimeout(() => {
      skipQueryEffectRef.current = true;
      const params = new URLSearchParams(location.search);
      if (queryValue) params.set("query", queryValue);
      else params.delete("query");

      params.delete("rel");
      params.delete("cursor");

      navigate({search: params.toString()});
    }, 300);

    return () => clearTimeout(timeout);
  }, [queryValue, navigate, location.search]);

  const onQueryChange = useCallback((value: string) => {
    setQueryValue(value);
  }, []);

  const onQueryClear = useCallback(() => {
    setQueryValue("");
  }, []);

  /**
   * Generates a URL with pagination and query parameters.
   *
   * @param rel - "next" or "previous"
   * @param cursor - Page cursor
   * @returns Complete URL string
   */
  const buildPaginationLink = useCallback(
    (rel: "next" | "previous", cursor: string): string => {
      const params = new URLSearchParams({
        rel,
        cursor,
        limit: String(limit),
        order: sortSelected[0],
      });
      const selectedView = tabItems[selectedTab].toLowerCase();
      params.set("selectedView", selectedView);

      if (queryValue) {
        params.set("query", queryValue);
      }

      return `${location.pathname}?${params.toString()}`;
    },
    [limit, sortSelected, queryValue, tabItems, selectedTab, location.pathname]
  );

  /**
   * Handles pagination navigation logic.
   */
  const {hasPreviousPage, hasNextPage, startCursor, endCursor} = pageInfo;
  const pagination = useMemo(() => {

    const hasPrevious = Boolean(hasPreviousPage && startCursor);
    const hasNext = Boolean(hasNextPage && endCursor) && products.length === productsLimit;

    return {
      hasPrevious,
      hasNext,
      onPrevious: () => {
        if (!hasPrevious || !startCursor) return;
        skipQueryEffectRef.current = true;
        navigate(buildPaginationLink("previous", startCursor));
      },
      onNext: () => {
        if (!hasNext || !endCursor) return;
        skipQueryEffectRef.current = true;
        navigate(buildPaginationLink("next", endCursor));
      },
    };
  }, [hasPreviousPage, startCursor, hasNextPage, endCursor, products.length, productsLimit, navigate, buildPaginationLink]);

  return {
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
  };
};

