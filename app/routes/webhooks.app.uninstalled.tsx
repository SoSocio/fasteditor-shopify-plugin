import type {ActionFunctionArgs} from "@remix-run/node";
import {authenticate} from "../shopify.server";
import {deleteShopFromSession} from "../models/session.server";

export const action = async ({request}: ActionFunctionArgs) => {
  const {shop, session, topic} = await authenticate.webhook(request);

  console.info(`Received ${topic} webhook for ${shop}`);

  // Webhook requests can trigger multiple times and after an app has already been uninstalled.
  // If this webhook already ran, the session may have been deleted previously.
  if (session) {
    await deleteShopFromSession(shop)
  }

  return new Response();
};
