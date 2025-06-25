export function loaderMethodNotAllowed(
  {
    request,
    endpoint,
  }: {
    request: Request;
    endpoint: string;
  }) {
  console.error(`GET not allowed on ${endpoint}. URL: ${request.url}`);
  throw new Response(null, {status: 405, statusText: "Method Not Allowed"});
}
