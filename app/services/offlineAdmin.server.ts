import {unauthenticated} from "../shopify.server";

/**
 * Returns an Admin API client backed by the shop's offline session.
 *
 * With `expiringOfflineAccessTokens` enabled, Shopify's Remix SDK refreshes a
 * token that is close to expiry and persists the replacement session before
 * returning this client. Background work must always obtain a client here,
 * rather than cache an access token.
 */
export async function getOfflineAdmin(shop: string) {
  const {admin} = await unauthenticated.admin(shop);

  return admin;
}
