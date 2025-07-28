import React from "react";
import type {LoaderFunctionArgs} from "@remix-run/node";
import {BlockStack, Box, Button, Card, Layout, List, Page, Text} from "@shopify/polaris";
import {authenticate} from "../shopify.server";
import {useLoaderData} from "@remix-run/react";
import {billingRequire} from "../services/billing.server";

const ENDPOINT = "/app/_index";

/**
 * Loader for the Getting Started page.
 */
export const loader = async ({request}: LoaderFunctionArgs): Promise<string> => {
  console.info(`[${ENDPOINT}] Getting Started Loader`);

  const {admin, billing, session} = await authenticate.admin(request);
  await billingRequire(admin, billing, session.shop);

  return session.shop.replace(".myshopify.com", "")
};

const Index = () => {
  const shopName = useLoaderData<string>()

  return (
    <Page title="Getting Started">
      <Box paddingBlockEnd="500">
        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="200">
                <Text as="h2" variant="headingMd">
                  FastEditor Integration
                </Text>
                <Text as="p" variant="bodyMd">
                  Before using FastEditor, connect your store to the platform via the Settings page.
                </Text>
                <Text as="span">
                  <Button url="/app/settings">Go to Settings</Button>
                </Text>
              </BlockStack>
            </Card>
          </Layout.Section>

          <Layout.Section>
            <Card>
              <BlockStack gap="200">
                <Text as="h2" variant="headingMd">
                  Customization Button
                </Text>
                <Text as="p" variant="bodyMd">
                  Add a customization button to your product page template and style it to match
                  your
                  theme.
                </Text>
                <Text as="span">
                  <Button
                    url={`https://admin.shopify.com/store/${shopName}/themes/current/editor`}
                    target="_blank"
                  >
                    Customize Appearance
                  </Button>
                </Text>
              </BlockStack>
            </Card>
          </Layout.Section>

          <Layout.Section>
            <Card>
              <BlockStack gap="200">
                <Text as="h2" variant="headingMd">
                  Product Setup
                </Text>
                <Text as="p" variant="bodyMd">
                  To link a Shopify product with FastEditor, follow these steps:
                </Text>
                <List>
                  <List.Item>Create or select a product in Shopify.</List.Item>
                  <List.Item>Go to the FastEditor platform.</List.Item>
                  <List.Item>Find the corresponding product.</List.Item>
                  <List.Item>Click <b>Configurations</b>.</List.Item>
                  <List.Item>You’ll land on the product details page.</List.Item>
                  <List.Item>Select the filters you want to use.</List.Item>
                  <List.Item>Click <b>SmartLink payload</b>.</List.Item>
                  <List.Item>Copy the <b>SKU</b>.</List.Item>
                  <List.Item>Return to the product settings in Shopify.</List.Item>
                  <List.Item>
                    <b>If the product has no variants:</b> paste the SKU into the <i>SKU (Stock
                    Keeping Unit)</i> field in the Inventory section and save your changes.
                  </List.Item>
                  <List.Item>
                    <b>If the product has variants:</b> open the specific variant, paste the SKU
                    into the <i>SKU (Stock Keeping Unit)</i> field in the Inventory section and
                    save your changes.
                  </List.Item>
                </List>

                <Text as="p" variant="bodyMd">
                  To display the customization button on the product page:
                </Text>
                <List>
                  <List.Item>Open the product you want to customize.</List.Item>
                  <List.Item>Scroll to the <b>Tags</b> section.</List.Item>
                  <List.Item>Add the <code>fasteditor</code> tag.</List.Item>
                </List>

                <Text as="span">
                  <Button
                    url={`https://admin.shopify.com/store/${shopName}/products?selectedView=all`}
                    target="_top"
                  >
                    Go to Products
                  </Button>
                </Text>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </Box>
    </Page>
  );
};

export default Index;
