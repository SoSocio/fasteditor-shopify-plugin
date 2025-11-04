import {type ActionFunctionArgs} from "@remix-run/node";
import {authenticate} from "../shopify.server";
import {billingCancel} from "../services/billing.server";
import {getAllAppSubscriptions} from "../services/app.server";
import {getShopSettings} from "../models/shopSettings.server";

const ENDPOINT = "/app/subscription/cancel";

/**
 * Handles subscription cancellation requests.
 * Cancels the active Shopify subscription and redirects to app home.
 *
 * @param request - Incoming request
 * @returns Redirect response to app home
 */
export const action = async ({request}: ActionFunctionArgs) => {
  const {admin, billing, session, redirect} = await authenticate.admin(request);

  try {
    console.info(`[${ENDPOINT}] Starting cancellation for shop: ${session.shop}`);

    const shopSettings = await getShopSettings(session.shop);
    if (!shopSettings?.shopifySubscriptionId) {
      console.warn(`[${ENDPOINT}] No subscription ID found for shop: ${session.shop}`);
      return redirect("/app");
    }

    const subscriptions = await getAllAppSubscriptions(admin);
    const currentSubscription = subscriptions.find(
      (s) => s.id === shopSettings.shopifySubscriptionId
    );

    if (!currentSubscription) {
      console.error(`[${ENDPOINT}] Subscription not found: ${shopSettings.shopifySubscriptionId}`);
      return redirect("/app");
    }

    await billingCancel(billing, currentSubscription.id);
    console.info(`[${ENDPOINT}] Successfully cancelled subscription for shop: ${session.shop}`);

    return redirect("/app");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[${ENDPOINT}] Failed to cancel subscription:`, errorMessage);
    return redirect("/app");
  }
};

