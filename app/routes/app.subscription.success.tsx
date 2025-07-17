import {type LoaderFunctionArgs} from "@remix-run/node";
import {authenticate} from "../shopify.server";
import {upsertSubscriptionShopSettings} from "../models/shopSettings.server";

const ENDPOINT = "/app/subscription/success";

export const loader = async ({request}: LoaderFunctionArgs) => {
  console.info(`[${ENDPOINT}] Loader started`);

  const {session, redirect} = await authenticate.admin(request);
  const searchParams = new URL(request.url).searchParams;
  const chargeId = searchParams.get("charge_id");

  if (!chargeId) {
    console.error(`[${ENDPOINT}] Missing charge_id`);
    throw new Error("No charge ID provided");
  }

  await upsertSubscriptionShopSettings(session.shop, chargeId);
  console.info(`[${ENDPOINT}] Subscription settings updated for shop: ${session.shop}`);

  return redirect("/app");
};
