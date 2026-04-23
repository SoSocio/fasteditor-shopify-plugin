import {useCallback, useEffect, useState} from "react";
import {useFetcher, useLoaderData} from "@remix-run/react";
import type {ActionFunctionArgs, LoaderFunctionArgs} from "@remix-run/node";
import type{IntegrationActionData, IntegrationFormValues} from "../types/integration.types";

import {BlockStack, Layout} from "@shopify/polaris";
import { useTranslation } from "react-i18next";

import {authenticate} from "../shopify.server";
import {
  getFastEditorShopSettings,
  parseFormData,
  setupFastEditorIntegration,
  validateFormData
} from "../services/fastEditorFactory.server";
import {getAppMetafield} from "../services/app.server";
import {
  type FastEditorDomainType,
  inferFastEditorActiveDomainType,
  normalizeDomainInput,
  resolveActiveFastEditorDomain,
} from "../utils/fastEditorDomain";

import {PageLayout} from "../components/layout/PageLayout";
import ShopIntegrationCard from "../components/SettingsPage/ShopIntegrationCard";
import ShopIntegrationForm from "../components/SettingsPage/ShopIntegrationForm";
import {
  UsageLimitBannerWithAction
} from "../components/banners/UsageLimit/UsageLimitBannerWithAction";
import {createMetafieldDefinition} from "../services/metafield.server";

const ENDPOINT = "/app/settings";

export interface SettingsLoader {
  fastEditorApiKey: string;
  activeFastEditorDomain: string;
  fastEditorDomain: string;
  customDomain: string;
  activeDomainType: FastEditorDomainType;
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
    const activeDomainType = inferFastEditorActiveDomainType({
      activeDomainType: shopSettings?.fastEditorActiveDomainType,
      fastEditorDomain: shopSettings?.fastEditorDomain,
      customDomain: shopSettings?.fastEditorCustomDomain,
    });
    const fastEditorDomain = normalizeDomainInput(shopSettings?.fastEditorDomain);
    const customDomain = normalizeDomainInput(shopSettings?.fastEditorCustomDomain);

    return {
      fastEditorApiKey: shopSettings?.fastEditorApiKey || "",
      activeFastEditorDomain: resolveActiveFastEditorDomain(activeDomainType, fastEditorDomain, customDomain),
      fastEditorDomain,
      customDomain,
      activeDomainType,
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
    const {apiKey, fastEditorDomain, customDomain, activeDomainType} = await parseFormData(request);
    const errors = validateFormData(apiKey, fastEditorDomain, customDomain, activeDomainType);

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

    await setupFastEditorIntegration(session.shop, apiKey, fastEditorDomain, customDomain, activeDomainType);

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
    activeFastEditorDomain,
    fastEditorDomain,
    customDomain,
    activeDomainType,
    appAvailability,
    shopName
  } = useLoaderData<typeof loader>()
  const fetcher = useFetcher<IntegrationActionData>();

  const [formValues, setFormValues] = useState<IntegrationFormValues>({
    apiKey: fastEditorApiKey ?? "",
    fastEditorDomain: fastEditorDomain ?? "",
    customDomain: customDomain ?? "",
    activeDomainType,
  });

  const [isApiKeyError, setApiKeyError] = useState<boolean>(false);
  const [isFastEditorDomainError, setFastEditorDomainError] = useState<boolean>(false);
  const [isCustomDomainError, setCustomDomainError] = useState<boolean>(false);
  const [fastEditorError, setFastEditorError] = useState<boolean>(false);

  const formErrors = fetcher.data?.body?.errors

  useEffect(() => {
    setFormValues({
      apiKey: fastEditorApiKey ?? "",
      fastEditorDomain: fastEditorDomain ?? "",
      customDomain: customDomain ?? "",
      activeDomainType,
    });
  }, [activeDomainType, customDomain, fastEditorApiKey, fastEditorDomain]);

  useEffect(() => {
    if (fetcher.state !== "idle" || !fetcher.data) return;
    const hasValidationErrors = fetcher.data.statusText === "validation-errors";

    if (fetcher.data?.ok) {
      const message = fetcher.data.statusText === "success"
        ? t("settings-page.integration-form.success-message")
        : fetcher.data.statusText;
      shopify.toast.show(message);
    } else if (!hasValidationErrors) {
      shopify.toast.show(t("settings-page.integration-form.connection-failed-error"));
    }

    setFastEditorError(!fetcher.data?.ok && !hasValidationErrors);

    setApiKeyError(!!formErrors?.apiKey);
    setFastEditorDomainError(!!formErrors?.fastEditorDomain);
    setCustomDomainError(!!formErrors?.customDomain);
  }, [fetcher.state, fetcher.data, t, formErrors?.apiKey, formErrors?.fastEditorDomain, formErrors?.customDomain]);

  const handleChange = useCallback(
    (field: keyof typeof formValues) => (value: string) => {
      setFormValues(prev => ({...prev, [field]: value}));
      if (field === "apiKey") setApiKeyError(false);
      if (field === "fastEditorDomain") setFastEditorDomainError(false);
      if (field === "customDomain") setCustomDomainError(false);
      setFastEditorError(false);
    }, []);

  const handleDomainTypeChange = useCallback((selected: string[]) => {
    const [nextValue] = selected;

    if (!nextValue) {
      return;
    }

    setFormValues((prev) => ({
      ...prev,
      activeDomainType: nextValue as FastEditorDomainType,
    }));
    setFastEditorDomainError(false);
    setCustomDomainError(false);
    setFastEditorError(false);
  }, []);

  const handleSubmit = useCallback(async () => {
    fetcher.submit(
      {
        apiKey: formValues.apiKey,
        fastEditorDomain: formValues.fastEditorDomain,
        customDomain: formValues.customDomain,
        activeDomainType: formValues.activeDomainType,
      },
      {
        method: "POST"
      });
  }, [formValues, fetcher]);

  if (appAvailability === "false") {
    return <UsageLimitBannerWithAction shopName={shopName}/>
  }

  return (
    <PageLayout title={t("settings-page.title")} fullWidth>
      <BlockStack gap="500">
        <Layout>
          <Layout.Section>
            <ShopIntegrationCard
              fastEditorApiKey={fastEditorApiKey}
              fastEditorDomain={activeFastEditorDomain}
            >
              <ShopIntegrationForm
                handleChange={handleChange}
                handleDomainTypeChange={handleDomainTypeChange}
                handleSubmit={handleSubmit}
                formValues={formValues}
                isApiKeyError={isApiKeyError}
                isFastEditorDomainError={isFastEditorDomainError}
                isCustomDomainError={isCustomDomainError}
                errors={formErrors}
                fastEditorError={fastEditorError}
                isLoading={fetcher.state === "submitting" || fetcher.state === "loading"}
              />
            </ShopIntegrationCard>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </PageLayout>
  );
}
export default Index;
