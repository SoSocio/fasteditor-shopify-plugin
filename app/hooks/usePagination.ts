import {useNavigate} from "react-router";
import {useMemo} from "react";

export const usePagination = ({pageInfo, limit}) => {
  const {hasPreviousPage, startCursor, hasNextPage, endCursor} = pageInfo
  const navigate = useNavigate();

  const buildPaginationLink = (rel, cursor) => {
    const params = new URLSearchParams({
      rel,
      cursor,
      limit: String(limit),
    });
    return `/app/dashboard?${params.toString()}`;
  };

  return useMemo(() => {
    return {
      hasPrevious: hasPreviousPage && !!startCursor,
      hasNext: hasNextPage && !!endCursor,
      onPrevious: () => {
        if (hasPreviousPage && startCursor) navigate(buildPaginationLink("previous", startCursor));
      },
      onNext: () => {
        if (hasNextPage && endCursor) navigate(buildPaginationLink("next", endCursor));
      },
    };
  }, [hasPreviousPage, startCursor, hasNextPage, endCursor, navigate]);
};
