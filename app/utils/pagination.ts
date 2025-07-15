type PaginationVariables = {
  first?: number;
  after?: string;
  last?: number;
  before?: string;
};

export function pagination(request: Request, defaultLimit: number): PaginationVariables {
  const url = new URL(request.url);
  const searchParam = url.searchParams;
  const rel = searchParam.get("rel");
  const cursor = searchParam.get("cursor")?.trim() || null;
  const limitParam = searchParam.get("limit");
  const limit = Number(limitParam ?? defaultLimit);

  const variables: PaginationVariables = {};

  if (isNaN(limit) || limit <= 0) {
    throw new Error("Invalid pagination limit");
  }

  switch (rel) {
    case "next":
      if (cursor) {
        variables.first = limit;
        variables.after = cursor;
      } else {
        variables.first = limit;
      }
      break;

    case "previous":
      if (cursor) {
        variables.last = limit;
        variables.before = cursor;
      } else {
        variables.last = limit;
      }
      break;

    default:
      variables.first = limit;
      break;
  }

  return variables;
}
