import { useEffect } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { data, useFetcher, useLoaderData } from "@remix-run/react";
import {
  Page,
  Layout,
  BlockStack,
} from "@shopify/polaris";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { billing, session } = await authenticate.admin(request);
  const { hasActivePayment, appSubscriptions } = await billing.check();

  console.log(hasActivePayment, appSubscriptions);

  return data({ hasActivePayment, appSubscriptions });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  
  return null;
};

export default function Index() {
  const fetcher = useFetcher<typeof action>();
  const { hasActivePayment, appSubscriptions } = useLoaderData<typeof loader>();

  const shopify = useAppBridge();

  useEffect(() => {
    shopify.toast.show("Product created");
  }, [shopify]);

  const generateProduct = () => fetcher.submit({}, { method: "POST" });

  return (
    <Page>
      <TitleBar title="FastEditor">
        <button variant="primary" onClick={generateProduct}>
          Generate a product
        </button>
      </TitleBar>
      <BlockStack gap="500">
        <Layout></Layout>
      </BlockStack>
    </Page>
  );
}
