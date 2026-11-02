import type {ActionFunctionArgs} from "@remix-run/node";
import {authenticate} from "../shopify.server";
import {
  getAllAppSubscriptions,
  initializeAppAvailability,
  setPaidMetafield
} from "../services/app.server";
import {
  getShopSettings,
  updateShopSubscriptionStatus,
  updateSubscriptionShopSettings
} from "../models/shopSettings.server";
import {isActiveSubscription, shouldTrackWebhookSubscription} from "../services/subscriptionState";

/**
 * Handles Shopify app subscription webhooks and updates the "paid" metafield.
 *
 * @param request - Incoming webhook request from Shopify
 * @returns null
 * @throws Response with status 200 if admin context is missing
 */
export const action = async ({request}: ActionFunctionArgs): Promise<null> => {
  const {payload, topic, shop, admin} = await authenticate.webhook(request);

  if (!admin) {
    console.error(`[${topic}] Missing admin context for shop: ${shop}`);
    throw new Response("Admin context is missing", {status: 200});
  }

  console.info(`[${topic}] Webhook received for shop: ${shop}`);
  const subscription = payload.app_subscription;
  const normalizedStatus = String(subscription?.status || "").toUpperCase();
  const payloadGraphId: string = subscription?.admin_graphql_api_id;

  try {
    const subscriptions = await getAllAppSubscriptions(admin);

    // The shop stays paid while any subscription is active, not only the one from this webhook
    const hasActiveSubscription =
      normalizedStatus === "ACTIVE" ||
      subscriptions.some((s) => s.id !== payloadGraphId && isActiveSubscription(s));
    await setPaidMetafield(admin, String(hasActiveSubscription));

    // Initialize app availability based on usage billing limit
    // Only check if subscription is active
    if (normalizedStatus === "ACTIVE") {
      await initializeAppAvailability(admin);
    }

    // Skip updates of other non-active subscriptions (e.g. expired pending charges)
    const shopSettings = await getShopSettings(shop);
    if (!shouldTrackWebhookSubscription(payloadGraphId, normalizedStatus, shopSettings?.shopifySubscriptionId)) {
      console.info(
        `[${topic}] Ignoring ${normalizedStatus} update for ${payloadGraphId}, ` +
        `current subscription is ${shopSettings?.shopifySubscriptionId}`
      );
      return null;
    }

    // If canceled, update only the status and leave other fields intact
    if (normalizedStatus === "CANCELLED") {
      await updateShopSubscriptionStatus(shop, normalizedStatus);
      return null;
    }

    // Try to enrich subscription details via Admin GraphQL
    const pick = subscriptions.find((s) => (s?.id === payloadGraphId));

    if (pick) {
      const currentPeriodEnd = pick.currentPeriodEnd ? new Date(pick.currentPeriodEnd) : null;

      await updateSubscriptionShopSettings(
        shop,
        pick.id,
        pick.status,
        currentPeriodEnd
      )
    } else {
      await updateSubscriptionShopSettings(
        shop,
        payloadGraphId,
        subscription?.status ?? null,
        null
    );
    }
  } catch (error) {
    console.error(`[${topic}] Failed to process subscription update:`, error);
  }

  return null;
};
