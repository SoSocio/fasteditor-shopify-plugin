import {type LoaderFunctionArgs} from "@remix-run/node";
import {authenticate} from "../shopify.server";
import {upsertSubscriptionShopSettings} from "../models/shopSettings.server";

const ENDPOINT = "app/subscription/success";

export const loader = async ({request}: LoaderFunctionArgs) => {
  const {session, redirect} = await authenticate.admin(request);

  console.log(`${ENDPOINT} Loader session:`, session)

  const searchParams = new URL(request.url).searchParams;
  console.log(`${ENDPOINT} Loader searchParams:`, searchParams)

  const chargeId = searchParams.get("charge_id");

  console.log(`${ENDPOINT} Loader chargeId:`, chargeId)

  if (!chargeId) {
    console.log(`${ENDPOINT} Loader No charge ID`, chargeId)
    throw new Error("No charge ID provided");
  }

  const response = await upsertSubscriptionShopSettings(session.shop, chargeId);

  console.log(`${ENDPOINT} Loader response:`, response)

  return redirect("/app");
};
