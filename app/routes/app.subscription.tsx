import React, {useCallback} from "react";
import {useFetcher, useLoaderData} from "@remix-run/react";
import type {ActionFunctionArgs, LoaderFunctionArgs} from "@remix-run/node";
import type {ActiveSubscription} from "../types/billing.types";
import {BlockStack, Card, InlineGrid, Layout, Page,} from "@shopify/polaris";
import {TitleBar} from "@shopify/app-bridge-react";
import {CurrentSubscription} from "../components/SubscriptionPage/CurrentSubscription";
import {UsageSubscription} from "../components/SubscriptionPage/UsageSubscription";
import {authenticate} from "../shopify.server";
import {
  billingCancel,
  billingRequire,
  fetchActiveSubscriptions,
  getActiveSubscription
} from "../services/billing.server";
import {getAppMetafield} from "../services/app.server";
import {UsageLimitBanner} from "../components/UsageLimitBanner";

const ENDPOINT = "/app/subscription";

interface SubscriptionLoader {
  subscription: ActiveSubscription,
  shopName: string;
  appAvailability: string;
}

export const loader = async (
  {request}: LoaderFunctionArgs
): Promise<SubscriptionLoader | null> => {
  console.info(`[${ENDPOINT}] Subscription Loader`);

  const {admin, billing, session} = await authenticate.admin(request);
  await billingRequire(admin, billing, session.shop);

  await getAppMetafield(admin, "fasteditor_app", "availability")

  try {
    const subscriptions = await fetchActiveSubscriptions(admin)
    const subscription = getActiveSubscription(subscriptions)
    const shopName = session.shop.replace(".myshopify.com", "");
    const appAvailability = await getAppMetafield(admin, "fasteditor_app", "availability")

    return {
      subscription,
      shopName,
      appAvailability: appAvailability?.value || "false"
    };
  } catch (error) {
    console.log(`[${ENDPOINT}] Subscription Loader Error:`, error);
    return null;
  }
};

export const action = async ({request}: ActionFunctionArgs): Promise<any> => {
  try {
    const {billing} = await authenticate.admin(request);

    const formData = await request.formData();
    const subscriptionId = String(formData.get("id") || "")

    if (!subscriptionId) {
      return null
    }

    await billingCancel(billing, subscriptionId)

    return null
  } catch (error) {
    console.log(error)
  }
};

const Subscription = () => {
  const fetcher = useFetcher();
  const {subscription, shopName, appAvailability} = useLoaderData<any>()

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
