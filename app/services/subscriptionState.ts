/**
 * Minimal subscription shape needed to decide which Shopify subscription is current.
 */
export interface SubscriptionLike {
  id: string;
  name: string;
  status: string;
  createdAt: string;
}

/**
 * Checks whether a subscription is in the ACTIVE status.
 *
 * @param subscription - Subscription to check
 * @returns true if the subscription is active
 */
export function isActiveSubscription(subscription: Pick<SubscriptionLike, "status">): boolean {
  return String(subscription.status || "").toUpperCase() === "ACTIVE";
}

/**
 * Resolves the subscription that should be treated as current for the shop.
 * Prefers the stored subscription while it is active; otherwise falls back to the
 * newest active subscription for the plan, so a stale stored ID (e.g. an expired
 * pending charge written by a webhook) does not lock the shop out.
 *
 * @param subscriptions - All app subscriptions of the installation
 * @param storedSubscriptionId - Subscription ID saved in shop settings
 * @param planName - Billing plan name
 * @returns Current subscription, the stored one if nothing is active, or undefined
 */
export function resolveCurrentSubscription<T extends SubscriptionLike>(
  subscriptions: T[],
  storedSubscriptionId: string | null | undefined,
  planName: string
): T | undefined {
  const stored = subscriptions.find((s) => s.id === storedSubscriptionId);
  if (stored && isActiveSubscription(stored)) {
    return stored;
  }

  const newestActive = subscriptions
    .filter((s) => s.name === planName && isActiveSubscription(s))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

  return newestActive ?? stored;
}

/**
 * Decides whether a subscription webhook may overwrite the subscription stored for the shop.
 * Updates of other, non-active subscriptions (expired or declined pending charges) are ignored.
 *
 * @param payloadSubscriptionId - Subscription ID from the webhook payload
 * @param payloadStatus - Subscription status from the webhook payload
 * @param storedSubscriptionId - Subscription ID saved in shop settings
 * @returns true if shop settings should be updated from this webhook
 */
export function shouldTrackWebhookSubscription(
  payloadSubscriptionId: string,
  payloadStatus: string,
  storedSubscriptionId: string | null | undefined
): boolean {
  return (
    !storedSubscriptionId ||
    payloadSubscriptionId === storedSubscriptionId ||
    isActiveSubscription({status: payloadStatus})
  );
}
