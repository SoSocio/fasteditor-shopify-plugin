import {type ActionFunctionArgs} from "@remix-run/node";
import {authenticate, TRIAL_PERIOD_DAYS} from "../shopify.server";
import {billingRequire, calculateRemainingTrialDays} from "../services/billing.server";
import {getShopSettings} from "../models/shopSettings.server";
import {getCurrentAppSubscription} from "../services/app.server";

/**
 * Handles subscription creation requests.
 * Triggers Shopify billing flow with appropriate trial period based on shop settings.
 *
 * @param request - Incoming request with shop context
 * @returns null (redirects to Shopify billing if needed)
 */
export const action = async ({request}: ActionFunctionArgs): Promise<null> => {
  const {admin, session, billing} = await authenticate.admin(request);
  const shopSettings = await getShopSettings(session.shop);

  // New installation: use default trial period
  if (!shopSettings) {
    await billingRequire(billing, session.shop, TRIAL_PERIOD_DAYS);
    return null;
  }

  // Existing shop: calculate remaining trial days
  const trialEndDate = shopSettings.trialEndDate
    ? new Date(shopSettings.trialEndDate)
    : null;
  const trialDays = calculateRemainingTrialDays(trialEndDate);

  await billingRequire(billing, session.shop, trialDays);

  // Shop already has an active subscription: re-sync settings so the app unlocks on reload
  await getCurrentAppSubscription(admin, shopSettings);
  return null;
};
