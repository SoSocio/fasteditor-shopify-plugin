import { type LoaderFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session, redirect } = await authenticate.admin(request);

  const searchParams = new URL(request.url).searchParams;
  const chargeId = searchParams.get("charge_id");

  if (!chargeId) {
    throw new Error("No charge ID provided");
  }

  await prisma.shopSettings.upsert({
    where: { shop: session.shop },
    update: {
      shopifySubscriptionId: chargeId,
      subscriptionStatus: "active",
      subscriptionCurrentPeriodEnd: new Date(),
    },
    create: {
      shop: session.shop,
      shopifySubscriptionId: chargeId,
      subscriptionStatus: "active",
      subscriptionCurrentPeriodEnd: new Date(),
    },
  });

  return redirect("/app");
};