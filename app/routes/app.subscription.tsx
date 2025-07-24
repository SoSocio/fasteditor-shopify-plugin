import {useLoaderData} from "@remix-run/react";
import type {ActionFunctionArgs, LoaderFunctionArgs} from "@remix-run/node";
import type {AppSubscription} from "@shopify/shopify-api";
import {BlockStack, Card, Layout, Page,} from "@shopify/polaris";
import {SubscriptionTable} from "../components/SubscriptionPage/SubscriptionTable";
import {authenticate} from "../shopify.server";
import {billingCheck, billingRequire} from "../services/billing.server";

const ENDPOINT = "/app/subscription";

export const loader = async (
  {request}: LoaderFunctionArgs
): Promise<any> => {
  console.info(`[${ENDPOINT}] Subscription Loader`);

  const {admin, billing, session} = await authenticate.admin(request);
  await billingRequire(admin, billing, session.shop);

  try {
    const subscription = await billingCheck(billing);
    console.log("Subscription Loader billing:", subscription)
    return subscription.appSubscriptions;
  } catch (error) {
    console.log(`[${ENDPOINT}] Subscription Loader Error:`, error);
  }
};

export const action = async ({request}: ActionFunctionArgs): Promise<any> => {
  await authenticate.admin(request);
  return null
};

const Subscription = () => {
  const subscriptions = useLoaderData<AppSubscription[]>()
  console.log("subscriptions", subscriptions)
  console.log("lineItems", subscriptions[0].lineItems)
  return (
    <Page fullWidth>
      <BlockStack gap="200">
        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <SubscriptionTable subscriptions={subscriptions}/>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}
export default Subscription;
