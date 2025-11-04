import type {ActionFunctionArgs} from "@remix-run/node";
import {authenticate} from "../shopify.server";
import {
  getAllAppSubscriptions,
  setAppAvailabilityMetafield,
  setPaidMetafield
} from "../services/app.server";
import {
  updateShopSubscriptionStatus,
  updateSubscriptionShopSettings
} from "../models/shopSettings.server";

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
  const isActive = subscription?.status === "ACTIVE" ? "true" : "false";
  const normalizedStatus = String(subscription?.status || "").toUpperCase();

  try {
    await setPaidMetafield(admin, isActive);
    await setAppAvailabilityMetafield(admin, "true")

    // If canceled, update only the status and leave other fields intact
    if (normalizedStatus === "CANCELLED") {
      await updateShopSubscriptionStatus(shop, normalizedStatus);
      return null;
    }

    // Try to enrich subscription details via Admin GraphQL
    const subscriptions = await getAllAppSubscriptions(admin);
    const payloadGraphId: string = subscription?.admin_graphql_api_id;
    const pick = subscriptions.find((s) => (s?.id === payloadGraphId));

    if (pick) {
      const currentPeriodEnd = new Date(pick.currentPeriodEnd);

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
