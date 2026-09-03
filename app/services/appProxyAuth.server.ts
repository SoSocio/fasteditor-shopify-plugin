type AppProxySession = {
  shop?: string;
};

type AppProxyContext = {
  session?: AppProxySession;
};

type AuthenticateAppProxy = (request: Request) => Promise<AppProxyContext>;

/**
 * Validates an App Proxy request through Shopify and returns its canonical shop.
 *
 * Never derive a shop from request query parameters or JSON payloads: those values
 * are attacker-controlled until Shopify validates the App Proxy signature.
 */
export async function authenticateAppProxyShop(
  request: Request,
  authenticateAppProxy: AuthenticateAppProxy,
): Promise<string> {
  const {session} = await authenticateAppProxy(request);
  const shop = session?.shop?.trim();

  if (!shop) {
    throw new Response(
      JSON.stringify({
        statusCode: 401,
        statusText: "Unauthorized",
        message: "A valid installed Shopify app session is required.",
        code: "MISSING_APP_PROXY_SESSION",
        ok: false,
      }),
      {
        status: 401,
        headers: {"Content-Type": "application/json"},
      },
    );
  }

  return shop;
}
