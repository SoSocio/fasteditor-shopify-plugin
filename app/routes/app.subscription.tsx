import React, {useCallback, useEffect, useState} from "react";
import {useFetcher, useLoaderData} from "@remix-run/react";
import type {ActionFunctionArgs, LoaderFunctionArgs} from "@remix-run/node";
import type {ActiveSubscription} from "../types/billing.types";
import {BlockStack, Card, InlineGrid, Layout, Page} from "@shopify/polaris";
import {TitleBar} from "@shopify/app-bridge-react";

import {authenticate} from "../shopify.server";
import {
  billingCancel,
  fetchActiveSubscriptions,
  getActiveSubscription
} from "../services/billing.server";
import {getAppMetafield} from "../services/app.server";

import {CurrentSubscription} from "../components/SubscriptionPage/CurrentSubscription";
import {UsageSubscription} from "../components/SubscriptionPage/UsageSubscription";
import {UsageLimitBanner} from "../components/banners/UsageLimit/UsageLimitBanner";

const ENDPOINT = "/app/subscription";

interface SubscriptionLoader {
  subscription: ActiveSubscription;
  shopName: string;
  appAvailability: string;
}

export const loader = async (
  {request}: LoaderFunctionArgs
): Promise<SubscriptionLoader | Response> => {
  console.info(`[${ENDPOINT}] Subscription Loader`);

  const {admin, session} = await authenticate.admin(request);

  try {
    const subscriptions = await fetchActiveSubscriptions(admin)
    const subscription = getActiveSubscription(subscriptions)

    const shopName = session.shop.replace(".myshopify.com", "");
    const appAvailability = await getAppMetafield(admin, "fasteditor_app", "availability")

    return {
      subscription,
      shopName,
      appAvailability: appAvailability?.value || "false",
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error(`[${ENDPOINT}] Loader Error:`, errorMessage);
    return new Response(errorMessage,
      {status: 200}
    );
  }
};

export const action = async ({request}: ActionFunctionArgs): Promise<null> => {
  try {
    const {billing} = await authenticate.admin(request);
    const formData = await request.formData();
    const subscriptionId = String(formData.get("id") || "")

    if (!subscriptionId) {
      return null
    }

    await billingCancel(billing, subscriptionId)
  } catch (error) {
    console.log(error)
  }

  return null
};

const Subscription = () => {
  const fetcher = useFetcher();
  const {
    subscription,
    shopName,
    appAvailability,
  } = useLoaderData<typeof loader>()
  const [cancelSubmitting, setCancelSubmitting] = useState(false);

  useEffect(() => {
    setCancelSubmitting(fetcher.state !== "idle")
  }, [fetcher, fetcher.state]);

  const onCancelSubscription = useCallback(async () => {
    fetcher.submit(
      {id: subscription.id},
      {method: "POST"}
    )
  }, [fetcher, subscription])

  return (
    <Page fullWidth>
      <TitleBar>
        <button
          variant="primary"
          onClick={onCancelSubscription}
          disabled={cancelSubmitting}
        >
          Cancel
        </button>
      </TitleBar>
      <BlockStack gap="400">
        {appAvailability === "false" && <UsageLimitBanner/>}
        <Layout>
          <Layout.Section>
            <InlineGrid columns={{sm: 1, md: ['oneThird', 'twoThirds']}} gap="400">
              <Card>
                <CurrentSubscription subscription={subscription}/>
              </Card>
              <Card>
                <UsageSubscription subscription={subscription} shopName={shopName}/>
              </Card>
            </InlineGrid>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}
export default Subscription;
