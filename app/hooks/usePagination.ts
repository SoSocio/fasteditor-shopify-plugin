import {useMemo} from "react";
import {useNavigate} from "react-router-dom";

interface PageInfo {
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  startCursor: string | null;
  endCursor: string | null;
}

interface UsePaginationProps {
  pageInfo: PageInfo;
  productsLimit: number;
}

export const usePagination = ({pageInfo, productsLimit}: UsePaginationProps) => {
  const navigate = useNavigate();
  const {hasPreviousPage, hasNextPage, startCursor, endCursor} = pageInfo;

  return useMemo(() => {
    const buildPaginationLink = (rel: "previous" | "next", cursor: string) => {
      const params = new URLSearchParams({
        rel,
        cursor,
        limit: String(productsLimit),
      });
      return `/app/dashboard?${params.toString()}`;
    };

    return {
      hasPrevious: Boolean(hasPreviousPage && startCursor),
      hasNext: Boolean(hasNextPage && endCursor),
      onPrevious: () => {
        if (hasPreviousPage && startCursor) {
          navigate(buildPaginationLink("previous", startCursor));
        }
      },
      onNext: () => {
        if (hasNextPage && endCursor) {
          navigate(buildPaginationLink("next", endCursor));
        }
      },
    };
  }, [hasPreviousPage, hasNextPage, startCursor, endCursor, productsLimit, navigate]);
};
