import {useFetcher, useLoaderData} from "@remix-run/react";
import type {ActionFunctionArgs, LoaderFunctionArgs} from "@remix-run/node";
import {BlockStack, Card, InlineGrid, Layout, Page,} from "@shopify/polaris";
import {authenticate} from "../shopify.server";
import {
  billingCancel,
  billingRequire,
  fetchActiveSubscriptions,
  getActiveSubscription
} from "../services/billing.server";
import {TitleBar} from "@shopify/app-bridge-react";
import {CurrentSubscription} from "../components/SubscriptionPage/CurrentSubscription";
import {UsageSubscription} from "../components/SubscriptionPage/UsageSubscription";
import {useCallback} from "react";

const ENDPOINT = "/app/subscription";

export const loader = async (
  {request}: LoaderFunctionArgs
): Promise<any> => {
  console.info(`[${ENDPOINT}] Subscription Loader`);

  const {admin, billing, session} = await authenticate.admin(request);
  await billingRequire(admin, billing, session.shop);

  try {
    const subscriptions = await fetchActiveSubscriptions(admin)
    const subscription = getActiveSubscription(subscriptions)
    const shopName = session.shop.replace(".myshopify.com", "");

    return {
      subscription,
      shopName
    };
  } catch (error) {
    console.log(`[${ENDPOINT}] Subscription Loader Error:`, error);
    return null;
  }
};

export const action = async ({request}: ActionFunctionArgs): Promise<any> => {
  const {billing} = await authenticate.admin(request);

  const formData = await request.formData();
  const subscriptionId = String(formData.get("id") || "")

  const test = await billingCancel(billing, subscriptionId)
  console.log("billingCancel test:", test)

  return null
};

const Subscription = () => {
  const fetcher = useFetcher();
  const {subscription, shopName} = useLoaderData<any>()

  const onCancelSubscription = useCallback(async () => {
    fetcher.submit(
      {
        id: subscription.id,
      },
      {
        method: "POST"
      }
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
      <BlockStack gap="200">
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
