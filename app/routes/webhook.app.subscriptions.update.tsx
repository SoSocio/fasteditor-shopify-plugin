import type {ActionFunctionArgs} from "@remix-run/node";
import {authenticate} from "../shopify.server";
import {setAppAvailabilityMetafield, setPaidMetafield} from "../services/app.server";

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
  const isActive = payload.app_subscription.status === "ACTIVE" ? "true" : "false";

  try {
    await setPaidMetafield(admin, isActive);
    await setAppAvailabilityMetafield(admin, "true")
  } catch (error) {
    console.error(`[${topic}] Failed to update metafield:`, error);
  }

  return null;
};
