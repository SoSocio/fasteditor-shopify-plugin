import {type LoaderFunctionArgs} from "@remix-run/node";
import {authenticate} from "../shopify.server";
import {getAllAppSubscriptions, initializeAppAvailability} from "../services/app.server";
import {createShopSettings, getShopSettings} from "../models/shopSettings.server";
import {getShopInfo, getShopLocale} from "../services/shop.server";
import { calculateTrialEndDate, formatSubscriptionId } from "app/services/billing.server";

const ENDPOINT = "/app/subscription/success";

/**
 * Handles successful subscription creation redirect from Shopify billing flow.
 * Creates or updates shop settings based on new subscription details.
 *
 * @param request - Incoming request with charge_id parameter
 * @returns Redirect to app home
 */
export const loader = async ({request}: LoaderFunctionArgs) => {
  const {admin, session, redirect} = await authenticate.admin(request);
  const searchParams = new URL(request.url).searchParams;
  console.log("[app.subscription.success.tsx] searchParams", searchParams);
  const chargeId = searchParams.get("charge_id");
  console.log("[app.subscription.success.tsx] chargeId", chargeId);

  if (!chargeId) {
    console.error(`[${ENDPOINT}] Missing charge_id parameter`);
    return redirect("/app");
  }

  try {
    // Fetch all subscriptions to find the newly created one
    const subscriptions = await getAllAppSubscriptions(admin);
    console.log("[app.subscription.success.tsx] subscriptions", subscriptions);
    const subscriptionId = formatSubscriptionId(chargeId);
    console.log("[app.subscription.success.tsx] subscriptionId", subscriptionId);
    const currentSubscription = subscriptions.find((s) => s?.id === subscriptionId);
    console.log("[app.subscription.success.tsx] currentSubscription", currentSubscription);

    // If subscription not found, redirect to app home
    if (!currentSubscription) {
      console.warn(`[${ENDPOINT}] Subscription not found for ID: ${subscriptionId}`);
      return redirect("/app");
    }

    const shopSettings = await getShopSettings(session.shop);

    // Create shop settings for new installations
    if (!shopSettings) {
      console.log("[app.subscription.success.tsx] shopSettings not found");
      const createdAt = new Date(currentSubscription.createdAt);
      const trialStartDate = createdAt;
      const trialEndDate = calculateTrialEndDate(createdAt, currentSubscription.trialDays);

      // Fetch shop localization and billing information
      const shopLocale = await getShopLocale(admin);
      const {countryCode, currency} = await getShopInfo(admin);

      await createShopSettings(
        session.shop,
        currentSubscription.id,
        currentSubscription.status,
        new Date(currentSubscription.currentPeriodEnd),
        trialStartDate,
        trialEndDate,
        shopLocale,
        countryCode,
        currency
      );

      console.info(`[${ENDPOINT}] Created shop settings for ${session.shop}`);
    }

    // Initialize app availability based on usage billing limit
    await initializeAppAvailability(admin);

    return redirect("/app");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[${ENDPOINT}] Failed to process subscription success:`, errorMessage);
    return redirect("/app");
  }
};
