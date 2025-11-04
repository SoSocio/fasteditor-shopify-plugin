import type {LoaderFunctionArgs} from "@remix-run/node";
import {useLoaderData} from "@remix-run/react";
import {BlockStack, Card, InlineGrid, Layout, Page} from "@shopify/polaris";
import {TitleBar} from "@shopify/app-bridge-react";

import type {ActiveSubscription} from "../types/billing.types";
import {authenticate} from "../shopify.server";
import {transformSubscription} from "../services/billing.server";
import {getAllAppSubscriptions, getAppMetafield} from "../services/app.server";

import {CurrentSubscription} from "../components/SubscriptionPage/CurrentSubscription";
import {UsageSubscription} from "../components/SubscriptionPage/UsageSubscription";
import {CancelSubscriptionModal} from "../components/SubscriptionPage/CancelSubscriptionModal";
import {UsageLimitBanner} from "../components/banners/UsageLimit/UsageLimitBanner";
import {getShopSettings} from "../models/shopSettings.server";

const ENDPOINT = "/app/subscription";

interface SubscriptionLoader {
  subscription: ActiveSubscription;
  shopName: string;
  appAvailability: string;
}

/**
 * Loader function that fetches subscription details and shop information.
 * Retrieves the current subscription, shop settings, and app availability status.
 *
 * @param request - The incoming request object
 * @returns Subscription loader data or an error response
 * @throws Error if shop settings or subscription data cannot be retrieved
 */
export const loader = async (
  {request}: LoaderFunctionArgs
): Promise<SubscriptionLoader | Response> => {
  console.info(`[${ENDPOINT}] Subscription Loader`);

  try {
    const {admin, session} = await authenticate.admin(request);
    const shopName = session.shop.replace(".myshopify.com", "");
    const appAvailability = await getAppMetafield(
      admin,
      "fasteditor_app",
      "availability"
    );

    const shopSettings = await getShopSettings(session.shop);
    if (!shopSettings) {
      console.error(
        `[${ENDPOINT}] Shop settings not found for shop: ${session.shop}`
      );
      throw new Error("Unable to fetch shop settings");
    }

    const subscriptions = await getAllAppSubscriptions(admin);
    if (
      !shopSettings?.shopifySubscriptionId ||
      !subscriptions ||
      subscriptions.length === 0
    ) {
      console.error(`[${ENDPOINT}] No subscriptions found`);
      throw new Error("Unable to fetch subscriptions");
    }

    const currentSubscription = subscriptions.find(
      (subscription) => subscription.id === shopSettings?.shopifySubscriptionId
    );
    if (!currentSubscription) {
      console.error(
        `[${ENDPOINT}] Subscription ${shopSettings?.shopifySubscriptionId} not found`
      );
      throw new Error("Unable to fetch current subscription");
    }

    const subscription = transformSubscription(currentSubscription);

    console.info(
      `[${ENDPOINT}] Successfully loaded subscription for shop: ${shopName}`
    );

    return {
      subscription,
      shopName,
      appAvailability: appAvailability?.value || "",
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[${ENDPOINT}] Loader Error:`, errorMessage);
    return new Response(errorMessage, {status: 200});
  }
};

/**
 * Subscription management page component.
 * Displays current subscription details, usage information, and provides
 * functionality to cancel the subscription via modal dialog.
 *
 * @returns The subscription page UI
 */
const Subscription = () => {
  const {subscription, shopName, appAvailability} = useLoaderData<typeof loader>();

  /**
   * Handles opening the cancellation modal
   */
  const handleOpenCancelModal = () => {
    shopify.modal.show("cancelSubscriptionModal");
  };

  return (
    <Page fullWidth>
      <TitleBar>
        <button variant="primary" onClick={handleOpenCancelModal}>
          Cancel
        </button>
      </TitleBar>
      <BlockStack gap="400">
        {appAvailability === "false" && <UsageLimitBanner />}
        <Layout>
          <Layout.Section>
            <InlineGrid
              columns={{sm: 1, md: ["oneThird", "twoThirds"]}}
              gap="400"
            >
              <Card>
                <CurrentSubscription subscription={subscription} />
              </Card>
              <Card>
                <UsageSubscription subscription={subscription} shopName={shopName} />
              </Card>
            </InlineGrid>
          </Layout.Section>
        </Layout>
      </BlockStack>

      <CancelSubscriptionModal />
    </Page>
  );
};

export default Subscription;
