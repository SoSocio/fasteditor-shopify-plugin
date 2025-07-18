export function actionMethodNotAllowed(
  {
    request,
    allowedMethods,
    endpoint,
  }: {
    request: Request;
    allowedMethods: string[];
    endpoint: string;
  }) {
  if (!allowedMethods.includes(request.method)) {
    const message = `${request.method} not allowed on ${endpoint}. URL: ${request.url}`;
    console.error(message);
    throw Response.json(
      {
        ok: false,
        status: 405,
        message: message,
      },
      {
        status: 405,
      }
    );
  }
}
