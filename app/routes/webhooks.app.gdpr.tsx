import type {ActionFunctionArgs} from "@remix-run/node";
import {authenticate} from "../shopify.server";
import {deleteShopSettings, getShopSettings} from "../models/shopSettings.server";
import {deleteShopFromSession} from "../models/session.server";
import {deleteFastEditorOrderItemsFoShop} from "../models/fastEditorOrderItems.server";
import {deleteUsageBillingHistoryForShop} from "../models/usageBillingHistory.server";

export const action = async ({request}: ActionFunctionArgs) => {
  try {
    const requestClone = request.clone();

    try {
      const {admin, shop, topic} = await authenticate.webhook(requestClone);

      switch (topic) {
        case "customers/data_request":
          console.log(`📌 No customer data stored. Responding to data request for shop: ${shop}`);
          break;

        case "customers/redact":
          console.log(`📌 No customer data stored. Ignoring redaction request for shop: ${shop}`);
          break;

        case "shop/redact":
          try {
            const shopSettings = await getShopSettings(shop);
            if (admin && shopSettings) {
              await deleteUsageBillingHistoryForShop(shop)
              await deleteFastEditorOrderItemsFoShop(shop)
              await deleteShopSettings(shop)
              await deleteShopFromSession(shop)
            }
          } catch (error) {
            console.error(
              `Failed to process shop redaction for ${shop}:`,
              error,
            );
          }
          break;

        default:
          console.warn(`❌ Unhandled webhook topic: ${topic}`);
          return new Response("Unhandled webhook topic", {status: 200});
      }

      return new Response("Webhook received", {status: 200});
    } catch (authError) {
      console.error("🔒 Webhook authentication failed:", authError);
      return new Response("Webhook HMAC validation failed", {status: 401});
    }
  } catch (error) {
    console.error("🚨 Webhook processing error:", error);
    return new Response("Error processing webhook", {status: 500});
  }
};
