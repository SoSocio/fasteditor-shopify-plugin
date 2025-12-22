import {useLoaderData} from "@remix-run/react";
import type {LoaderFunctionArgs} from "@remix-run/node";

import {
  InlineGrid,
  Card,
  BlockStack,
  Box,
  Text,
  Button,
  List,
} from "@shopify/polaris";

import {authenticate} from "../shopify.server";
import {getAppMetafield} from "../services/app.server";

import {
  UsageLimitBannerWithAction
} from "../components/banners/UsageLimit/UsageLimitBannerWithAction";
import { useTranslation } from "react-i18next";
import { PageLayout } from "../components/layout/PageLayout";


const ENDPOINT = "/app/_index";

interface GettingStartedLoader {
  shopName: string;
  apiKey: string;
  appAvailability: string;
}

/**
 * Loader for the Getting Started page.
 */
export const loader = async (
  {request}: LoaderFunctionArgs): Promise<GettingStartedLoader> => {
  console.info(`[${ENDPOINT}] Getting Started Loader`);

  const {admin, session} = await authenticate.admin(request);
  const appAvailability = await getAppMetafield(admin, "fasteditor_app", "availability")

  return {
    shopName: session.shop.replace(".myshopify.com", ""),
    appAvailability: appAvailability?.value,
    apiKey: process.env.SHOPIFY_API_KEY || "",
  }
};

const Index = () => {
  const {shopName, appAvailability, apiKey} = useLoaderData<typeof loader>()

  const { t } = useTranslation();

  if (appAvailability === "false") {
    return <UsageLimitBannerWithAction shopName={shopName}/>
  }

  return (
    <PageLayout title={t("getting-started-page.title")} fullWidth>
      <Box paddingBlockEnd="500">
        <InlineGrid columns={{sm: 1, md: 2}} gap="400">
          <BlockStack gap="200">
            <Card>
              <BlockStack gap="200">
                <Text as="h2" variant="headingMd">
                  {t("getting-started-page.integration.title")}
                </Text>
                <Text as="p" variant="bodyMd">
                  {t("getting-started-page.integration.description")}
                </Text>
                <Text as="span">
                  <Button url="/app/settings">{t("getting-started-page.integration.button")}</Button>
                </Text>
              </BlockStack>
            </Card>
            <Card>
              <BlockStack gap="200">
                <Text as="h2" variant="headingMd">
                  {t("getting-started-page.product-setup.title")}
                </Text>
                <Text as="p" variant="bodyMd">
                  {t("getting-started-page.product-setup.description")}
                </Text>
                <List>
                  <List.Item>
                    <span dangerouslySetInnerHTML={{ __html: t("getting-started-page.product-setup.steps.item-1") }} />
                  </List.Item>
                  <List.Item>{t("getting-started-page.product-setup.steps.item-2")}</List.Item>
                  <List.Item>{t("getting-started-page.product-setup.steps.item-3")}</List.Item>
                  <List.Item>
                    <span dangerouslySetInnerHTML={{ __html: t("getting-started-page.product-setup.steps.item-4") }} />
                  </List.Item>
                  <List.Item>{t("getting-started-page.product-setup.steps.item-5")}</List.Item>
                  <List.Item>{t("getting-started-page.product-setup.steps.item-6")}</List.Item>
                  <List.Item>
                    <span dangerouslySetInnerHTML={{ __html: t("getting-started-page.product-setup.steps.item-7") }} />
                  </List.Item>
                  <List.Item>
                    <span dangerouslySetInnerHTML={{ __html: t("getting-started-page.product-setup.steps.item-8") }} />
                  </List.Item>
                  <List.Item>{t("getting-started-page.product-setup.steps.item-9")}</List.Item>
                  <List.Item>
                    <span dangerouslySetInnerHTML={{ __html: t("getting-started-page.product-setup.steps.item-10") }} />
                  </List.Item>
                  <List.Item>
                    <span dangerouslySetInnerHTML={{ __html: t("getting-started-page.product-setup.steps.item-11") }} />
                  </List.Item>
                </List>

                <Text as="p" variant="bodyMd">
                  {t("getting-started-page.product-setup.display-button-description")}
                </Text>
                <List>
                  <List.Item>{t("getting-started-page.product-setup.display-steps.item-1")}</List.Item>
                  <List.Item>
                    <span dangerouslySetInnerHTML={{ __html: t("getting-started-page.product-setup.display-steps.item-2") }} />
                  </List.Item>
                  <List.Item>
                    <span dangerouslySetInnerHTML={{ __html: t("getting-started-page.product-setup.display-steps.item-3") }} />
                  </List.Item>
                </List>

                <Text as="span">
                  <Button
                    url={`https://admin.shopify.com/store/${shopName}/products?selectedView=all`}
                    target="_top"
                  >
                    {t("getting-started-page.product-setup.button")}
                  </Button>
                </Text>
              </BlockStack>
            </Card>
          </BlockStack>

          <BlockStack gap="200">
            <Card>
              <BlockStack gap="200">
                <Text as="h2" variant="headingMd">
                  {t("getting-started-page.customization-button.title")}
                </Text>
                <video
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: "6px",
                    objectFit: "cover",
                    aspectRatio: "16 / 9"
                  }}
                  autoPlay
                  muted
                  loop
                  poster="customize-button.png"
                >
                  <source src="customize-button.mp4" type="video/mp4"/>
                </video>
                <Text as="p" variant="bodyMd">
                  {t("getting-started-page.customization-button.description")}
                </Text>
                <Text as="span">
                  <Button
                    url={`https://admin.shopify.com/store/${shopName}/themes/current/editor?template=product&addAppBlockId=${apiKey}/product-customize-block&target=mainSection`}
                    target="_blank"
                  >
                    {t("getting-started-page.customization-button.button")}
                  </Button>
                </Text>
              </BlockStack>
            </Card>
            <Card>
              <BlockStack gap="200">
                <Text as="h2" variant="headingMd">
                  {t("getting-started-page.sticky-bar.title")}
                </Text>
                <video
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: "6px",
                    objectFit: "cover",
                    aspectRatio: "16 / 9"
                  }}
                  autoPlay
                  muted
                  loop poster="sticky-bar.png"
                >
                  <source src="sticky-bar.mp4" type="video/mp4"/>
                </video>
                <Text as="p" variant="bodyMd">
                  {t("getting-started-page.sticky-bar.description")}
                </Text>
                <Text as="span">
                  <Button
                    url={`https://admin.shopify.com/store/${shopName}/admin/themes/current/editor?context=apps&template=product`}
                    target="_blank"
                  >
                    {t("getting-started-page.sticky-bar.button")}
                  </Button>
                </Text>
              </BlockStack>
            </Card>
          </BlockStack>
        </InlineGrid>
      </Box>
    </PageLayout>
  );
};

export default Index;
