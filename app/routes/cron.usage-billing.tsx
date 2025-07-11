import {authenticate} from "../shopify.server";
import type {LoaderFunctionArgs} from "@remix-run/node";
import {findShopsWithFastEditorOrderItemsLastMonth} from "../models/fastEditorOrderItems.server";
import {getOneMonthAgoDate, handleShopBilling} from "../services/usageBilling.server";

const ENDPOINT = "cron/usage-billing"

export const loader = async ({request}: LoaderFunctionArgs): Promise<Response> => {
  try {
    const {billing} = await authenticate.admin(request);
    const oneMonthAgo = getOneMonthAgoDate();

    const shops = await findShopsWithFastEditorOrderItemsLastMonth(oneMonthAgo);

    if (shops.length === 0) {
      return new Response("No shops with FastEditor orders in the last month.", {status: 200});
    }

    for (const {shop} of shops) {
      await handleShopBilling(shop, oneMonthAgo, ENDPOINT, billing);
    }

    return new Response("Billing run completed.", {status: 200});

  } catch (error) {
    console.error(`[${ENDPOINT}] Error running monthly usage billing:`, error);
    return new Response("Internal Server Error", {status: 500});
  }
};
