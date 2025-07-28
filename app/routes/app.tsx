import type {HeadersFunction, LoaderFunctionArgs} from "@remix-run/node";
import {Link, Outlet, useLoaderData, useRouteError} from "@remix-run/react";
import {boundary} from "@shopify/shopify-app-remix/server";
import {AppProvider} from "@shopify/shopify-app-remix/react";
import {NavMenu} from "@shopify/app-bridge-react";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";

import {authenticate} from "../shopify.server";
import {BlockStack, Box, Link as PolarisLink, Text} from "@shopify/polaris";

export const links = () => [{rel: "stylesheet", href: polarisStyles}];

export const loader = async ({request}: LoaderFunctionArgs) => {
  await authenticate.admin(request);

  return {
    apiKey: process.env.SHOPIFY_API_KEY || "",
    supportEmail: process.env.SUPPORT_EMAIL || ""
  };
};

export default function App() {
  const {apiKey, supportEmail} = useLoaderData<typeof loader>();

  return (
    <AppProvider isEmbeddedApp apiKey={apiKey}>
      <NavMenu>
        <Link to="/app" rel="home">
          Home
        </Link>
        <Link to="/app/dashboard">Dashboard</Link>
        <Link to="/app/subscription">Subscription</Link>
      </NavMenu>
      <Outlet/>
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
