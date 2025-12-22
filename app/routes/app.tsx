import type {ActionFunctionArgs, HeadersFunction, LoaderFunctionArgs} from "@remix-run/node";
import {Link, Outlet, useLoaderData, useRouteError} from "@remix-run/react";

import {boundary} from "@shopify/shopify-app-remix/server";
import {AppProvider} from "@shopify/shopify-app-remix/react";
import {NavMenu} from "@shopify/app-bridge-react";

import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import {BlockStack, Box, Link as PolarisLink, Text} from "@shopify/polaris";
import { useTranslation } from "react-i18next";

import {authenticate} from "../shopify.server";
import {SUPPORT_EMAIL} from "../constants";
import {getShopSettings} from "../models/shopSettings.server";
import {getAllAppSubscriptions} from "../services/app.server";
import NoSubscriptionPage from "app/components/SubscriptionPage/NoSubscriptionPage";
import { getMerchant, createMerchant } from "../models/merchant.server";
import i18n from "../i18n";

export const links = () => [{rel: "stylesheet", href: polarisStyles}];

interface AppLoader {
  apiKey: string;
  supportEmail: string;
  appSubscription: boolean;
}

/**
 * Loader function that determines app subscription status.
 * Checks if the shop has an active Shopify subscription and grants access accordingly.
 *
 * @param request - The incoming request object
 * @returns App loader data with subscription status
 */
export const loader = async ({
  request,
}: LoaderFunctionArgs): Promise<AppLoader> => {

  const {admin, session} = await authenticate.admin(request);
  let appAvailability = true;

  // Create or update merchant record only if needed
  const userId = session.onlineAccessInfo?.associated_user.id;
  console.log("[app.tsx] userId", userId);
  if (userId) {
    const merchantLanguage = session.onlineAccessInfo?.associated_user.locale || i18n.fallbackLng;
    console.log("[app.tsx] merchantLanguage", merchantLanguage);
    const existingMerchant = await getMerchant(String(userId), session.shop);
    console.log("[app.tsx] existingMerchant", existingMerchant);
    if (!existingMerchant) {
      // New user - create merchant record
      await createMerchant(
        String(userId),
        session.shop,
        merchantLanguage
      );
      console.info(`[app.tsx] Created new merchant for userId: ${userId}, shop: ${session.shop}, language: ${merchantLanguage}`);
    }
    // If merchant exists and language hasn't changed, do nothing
  }

  const shopSettings = await getShopSettings(session.shop);
  console.log("[app.tsx] shopSettings", shopSettings);
  if (!shopSettings) {
    console.log("[app.tsx] shopSettings not found. 1 case");
    return {
      apiKey: process.env.SHOPIFY_API_KEY || "",
      supportEmail: SUPPORT_EMAIL,
      appSubscription: false,
    };
  }

  const subscriptions = await getAllAppSubscriptions(admin);
  console.log("[app.tsx] subscriptions", subscriptions);
  if (
    !shopSettings?.shopifySubscriptionId ||
    !subscriptions ||
    subscriptions.length === 0
  ) {
    console.log("[app.tsx] shopSettings?.shopifySubscriptionId or subscriptions not found. 2 case");
    appAvailability = false;
  }

  const currentSubscription = subscriptions.find(
    (subscription) => subscription.id === shopSettings?.shopifySubscriptionId
  );
  console.log("[app.tsx] currentSubscription", currentSubscription);

  if (!currentSubscription) {
    console.log("[app.tsx] currentSubscription not found. 3 case");
    appAvailability = false;
  } else {
    const currentSubscriptionStatus = currentSubscription.status?.toUpperCase();
    if (!currentSubscriptionStatus || currentSubscriptionStatus !== "ACTIVE") {
      appAvailability = false;
    }
  }

  return {
    apiKey: process.env.SHOPIFY_API_KEY || "",
    supportEmail: SUPPORT_EMAIL,
    appSubscription: appAvailability,
  };
};

/**
 * Action handler for app layout requests.
 * Currently only handles authentication without any additional logic.
 *
 * @param request - The incoming request object
 * @returns null
 */
export const action = async ({request}: ActionFunctionArgs): Promise<null> => {
  await authenticate.admin(request);
  return null;
};

/**
 * Main app layout component.
 * Provides the application shell with navigation, subscription checks,
 * and footer support information.
 *
 * @returns The app layout UI
 */
export default function App() {
  const { t } = useTranslation();
  const {apiKey, supportEmail, appSubscription} = useLoaderData<typeof loader>();

  return (
    <AppProvider isEmbeddedApp apiKey={apiKey}>
      <NavMenu>
        <Link to="/app" rel="home">
          {t("navigation.home")}
        </Link>
        <Link to="/app/dashboard">{t("navigation.dashboard")}</Link>
        <Link to="/app/settings">{t("navigation.settings")}</Link>
        <Link to="/app/subscription">{t("navigation.subscription")}</Link>
      </NavMenu>
      {!appSubscription ? <NoSubscriptionPage /> : <Outlet />}
      <Box padding="500">
        <BlockStack inlineAlign="center">
          <Text as="p" variant="bodySm">
            {t("footer.support-text")}{" "}
            <PolarisLink url={`mailto:${supportEmail}`} target="_blank">
              {supportEmail}
            </PolarisLink>
          </Text>
        </BlockStack>
      </Box>
    </AppProvider>
  );
}

// Shopify needs Remix to catch some thrown responses, so that their headers are included in the
// response.
export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
