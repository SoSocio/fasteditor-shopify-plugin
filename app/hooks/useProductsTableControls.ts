import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {useNavigate} from "react-router-dom";
import {
  IndexFiltersMode,
  type IndexFiltersProps,
  type TabProps,
  useSetIndexFiltersMode
} from "@shopify/polaris";
import {useLocation, useNavigation} from "@remix-run/react";
import { useTranslation } from "react-i18next";

interface PageInfo {
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  startCursor: string | null;
  endCursor: string | null;
}

interface ProductsTableControls {
  pageInfo: PageInfo;
}

/**
 * Custom hook for handling pagination, sorting, and search filtering of products.
 * @param productList - Array of product nodes.
 * @param pageInfo - Shopify GraphQL page info.
 * @returns Pagination, sorting, and search state handlers.
 */
export const useProductsTableControls = (
  {
    pageInfo
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

  const { t } = useTranslation();
  const {mode, setMode} = useSetIndexFiltersMode(IndexFiltersMode.Default);

  const tabKeys = ['all', 'active', 'draft', 'archived'];
  const tabItems = tabKeys.map(key => t(`dashboard-page.tabs.${key}`));

  const [selectedTab, setSelectedTab] = useState(
    tabKeys.findIndex((key) => key.toLowerCase() === initialSelectedView.toLowerCase()) || 0
  );

  const onChangeTab = useCallback((item: string, index: number) => {
    skipQueryEffectRef.current = true;
    setSelectedTab(index);

    const params = new URLSearchParams(location.search);
    params.set("selectedView", tabKeys[index]);
    params.delete("rel");
    params.delete("cursor");
    navigate({search: params.toString()});
  }, [location.search, navigate, tabKeys]);

  const tabs: TabProps[] = tabItems.map((item, index) => ({
    content: item,
    id: `${item}-${index}`,
    isLocked: index === 0,
    onAction: () => onChangeTab(item, index),
  }));

  const sortOptions: IndexFiltersProps['sortOptions'] = [
    {label: t("dashboard-page.sort.product-label"), value: 'title asc', directionLabel: t("dashboard-page.sort.direction-az")},
    {label: t("dashboard-page.sort.product-label"), value: 'title desc', directionLabel: t("dashboard-page.sort.direction-za")},
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
    skipQueryEffectRef.current = true;
    const timeout = setTimeout(() => {
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
        order: sortSelected[0],
      });
      const selectedView = tabKeys[selectedTab];
      params.set("selectedView", selectedView);

      if (queryValue) {
        params.set("query", queryValue);
      }

      return `${location.pathname}?${params.toString()}`;
    },
    [sortSelected, queryValue, selectedTab, location.pathname, tabKeys]
  );

  /**
   * Handles pagination navigation logic.
   */
  const {hasPreviousPage, hasNextPage, startCursor, endCursor} = pageInfo;
  const pagination = useMemo(() => {

    const hasPrevious = Boolean(hasPreviousPage && startCursor);
    const hasNext = Boolean(hasNextPage && endCursor);

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
  }, [hasPreviousPage, startCursor, hasNextPage, endCursor, navigate, buildPaginationLink]);

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

