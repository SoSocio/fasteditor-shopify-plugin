import React from "react";
import type {ActionFunctionArgs, HeadersFunction, LoaderFunctionArgs} from "@remix-run/node";
import {Link, Outlet, useFetcher, useLoaderData, useRouteError} from "@remix-run/react";

import {boundary} from "@shopify/shopify-app-remix/server";
import {AppProvider} from "@shopify/shopify-app-remix/react";
import {NavMenu} from "@shopify/app-bridge-react";

import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import {BlockStack, Box, Link as PolarisLink, Text} from "@shopify/polaris";

import {authenticate} from "../shopify.server";
import {SUPPORT_EMAIL} from "../constants";
import {getShopSettings} from "../models/shopSettings.server";
import {billingRequire, fetchActiveSubscriptions} from "../services/billing.server";
import {SubscriptionBanner} from "../components/banners/SubscriptionBanner";

export const links = () => [{rel: "stylesheet", href: polarisStyles}];

interface AppLoader {
  apiKey: string;
  supportEmail: string;
  appSubscription: boolean;
}

export const loader = async ({request}: LoaderFunctionArgs): Promise<AppLoader> => {
  const {admin, session, billing} = await authenticate.admin(request);

  const shopSettings = await getShopSettings(session.shop)
  if (!shopSettings?.subscriptionStatus) {
    await billingRequire(admin, billing, session.shop);
  }

  const subscriptions = await fetchActiveSubscriptions(admin);
  const hasActiveSubscription = subscriptions.length > 0;

  return {
    apiKey: process.env.SHOPIFY_API_KEY || "",
    supportEmail: SUPPORT_EMAIL,
    appSubscription: hasActiveSubscription,
  };
};

export const action = async ({request}: ActionFunctionArgs): Promise<null> => {
  const {admin, session, billing} = await authenticate.admin(request);
  await billingRequire(admin, billing, session.shop);
  return null
};

export default function App() {
  const {apiKey, supportEmail, appSubscription} = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();

  return (
    <AppProvider isEmbeddedApp apiKey={apiKey}>
      <NavMenu>
        <Link to="/app" rel="home">
          Home
        </Link>
        <Link to="/app/dashboard">
          Dashboard
        </Link>
        <Link to="/app/settings">
          Settings
        </Link>
        <Link to="/app/subscription">
          Subscription
        </Link>
      </NavMenu>
      {!appSubscription ? <SubscriptionBanner fetcher={fetcher}/> : <Outlet/>}
      <Box padding="500">
        <BlockStack inlineAlign="center">
          <Text as="p" variant="bodySm">
            Need help? Contact our support team at{" "}
            <PolarisLink
              url={`mailto:${supportEmail}`}
              target="_blank"
            >
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
