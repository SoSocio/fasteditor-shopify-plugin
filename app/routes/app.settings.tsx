import React, {useCallback, useEffect, useState} from "react";
import {useFetcher, useLoaderData} from "@remix-run/react";
import type {ActionFunctionArgs, LoaderFunctionArgs} from "@remix-run/node";
import type {IntegrationActionData, IntegrationFormValues} from "../types/integration.types";

import {BlockStack, Layout, Page} from "@shopify/polaris";
import { useTranslation } from "react-i18next";

import {authenticate} from "../shopify.server";
import {
  getFastEditorShopSettings,
  parseFormData,
  setupFastEditorIntegration,
  validateFormData
} from "../services/fastEditorFactory.server";
import {getAppMetafield} from "../services/app.server";

import ShopIntegrationCard from "../components/SettingsPage/ShopIntegrationCard";
import ShopIntegrationForm from "../components/SettingsPage/ShopIntegrationForm";
import {
  UsageLimitBannerWithAction
} from "../components/banners/UsageLimit/UsageLimitBannerWithAction";
import {createMetafieldDefinition} from "../services/metafield.server";

const ENDPOINT = "/app/settings";

export interface SettingsLoader {
  fastEditorApiKey: string;
  fastEditorDomain: string;
  appAvailability: string;
  shopName: string;
}

export const loader = async (
  {request}: LoaderFunctionArgs
): Promise<Response | SettingsLoader> => {
  const {admin, session} = await authenticate.admin(request);

  try {
    const shopSettings = await getFastEditorShopSettings(session.shop)
    const appAvailability = await getAppMetafield(admin, "fasteditor_app", "availability")

    return {
      fastEditorApiKey: shopSettings?.fastEditorApiKey || "",
      fastEditorDomain: shopSettings?.fastEditorDomain || "",
      appAvailability: appAvailability?.value,
      shopName: session.shop.replace(".myshopify.com", ""),
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error(`[${ENDPOINT}] Loader error:`, errorMessage);
    return new Response(errorMessage,
      {status: 200}
    );
  }
};

export const action = async ({request}: ActionFunctionArgs): Promise<Response> => {
  const {admin, session} = await authenticate.admin(request);

  try {
    console.info(`[${ENDPOINT}] FastEditor API integration request for shop ${session.shop}`);
    const {apiKey, apiDomain} = await parseFormData(request);
    const errors = validateFormData(apiKey, apiDomain);

    if (Object.keys(errors).length > 0) {
      return new Response(JSON.stringify({
          statusCode: 400,
          statusText: "validation-errors",
          body: {errors},
          ok: false,
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    await setupFastEditorIntegration(session.shop, apiKey, apiDomain);

    await createMetafieldDefinition(
      admin,
      "FastEditor Order Images",
      "order_images",
      "List of image URLs for order items customized via FastEditor",
      "list.url",
      "ORDER"
    )

    return new Response(JSON.stringify({
        statusCode: 200,
        statusText: "success",
        ok: true
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error(`[${ENDPOINT}] FastEditor integration failed.`, errorMessage);
    return new Response(JSON.stringify({
        statusCode: 500,
        statusText: errorMessage,
        ok: false
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
};

const Index = () => {
  const { t } = useTranslation();
  const {
    fastEditorApiKey,
    fastEditorDomain,
    appAvailability,
    shopName
  } = useLoaderData<typeof loader>()
  const fetcher = useFetcher<IntegrationActionData>();

  const [formValues, setFormValues] = useState<IntegrationFormValues>({
    apiKey: fastEditorApiKey ?? "",
    apiDomain: fastEditorDomain ?? "",
  });

  const [isApiKeyError, setApiKeyError] = useState<boolean>(false);
  const [isApiDomainError, setApiDomainError] = useState<boolean>(false);
  const [fastEditorError, setFastEditorError] = useState<boolean>(false);

  const formErrors = fetcher.data?.body?.errors

  useEffect(() => {
    if (fetcher.state !== "idle" || !fetcher.data) return;

    if (fetcher.data?.ok) {
      const message = fetcher.data.statusText === "success"
        ? t("settings-page.integration-form.success-message")
        : fetcher.data.statusText;
      shopify.toast.show(message);
    } else {
      shopify.toast.show(t("settings-page.integration-form.connection-failed-error"));
    }

    if (!fetcher.data?.ok) {
      setFastEditorError(true);
    } else {
      setFastEditorError(false);
    }

    setApiKeyError(!!formErrors?.apiKey);
    setApiDomainError(!!formErrors?.apiDomain);
  }, [fetcher.state, fetcher.data, t, formErrors?.apiKey, formErrors?.apiDomain]);

  const handleChange = useCallback(
    (field: keyof typeof formValues) => (value: string) => {
      setFormValues(prev => ({...prev, [field]: value}));
    }, []);

  const handleSubmit = useCallback(async () => {
    fetcher.submit(
      {
        apiKey: formValues.apiKey,
        apiDomain: formValues.apiDomain,
      },
      {
        method: "POST"
      });
  }, [formValues, fetcher]);

  if (appAvailability === "false") {
    return <UsageLimitBannerWithAction shopName={shopName}/>
  }

  return (
    <Page fullWidth title={t("settings-page.title")}>
      <BlockStack gap="500">
        <Layout>
          <Layout.Section>
            <ShopIntegrationCard
              fastEditorApiKey={fastEditorApiKey}
              fastEditorDomain={fastEditorDomain}
            >
              <ShopIntegrationForm
                handleChange={handleChange}
                handleSubmit={handleSubmit}
                formValues={formValues}
                isApiKeyError={isApiKeyError}
                isApiDomainError={isApiDomainError}
                errors={formErrors}
                fastEditorError={fastEditorError}
              />
            </ShopIntegrationCard>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}
export default Index;
