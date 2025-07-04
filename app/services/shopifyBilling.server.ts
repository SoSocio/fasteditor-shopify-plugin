import {MONTHLY_PLAN} from "../shopify.server";

export async function shopifyBilling(shop: string, billing): Promise<Response | void> {

  const shopName = shop.replace(".myshopify.com", "");
  return await billing.require({
    plans: [MONTHLY_PLAN],
    onFailure: async () => billing.request({
      plan: MONTHLY_PLAN,
      isTest: true,
      returnUrl: `https://admin.shopify.com/store/${shopName}/apps/${process.env.APP_NAME}/app/subscription/success`,
    }),
  });
}
