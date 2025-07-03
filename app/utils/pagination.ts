export function pagination(request, limit) {
  const url = new URL(request.url);
  const searchParam = url.searchParams;
  const rel = searchParam.get("rel");
  const cursor = searchParam.get("cursor");
  const pageSize = Number(url.searchParams.get("limit") || limit);

  const variables = {}

  if (cursor && rel === "next") {
    variables.first = pageSize;
    variables.after = cursor;
  } else if (cursor && rel === "previous") {
    variables.last = pageSize;
    variables.before = cursor;
  } else {
    variables.first = pageSize;
  }
  return variables;
}
