import {useCallback, useEffect, useState} from "react";
import {useFetcher, useLoaderData} from "@remix-run/react";
import {BlockStack, Layout, Page,} from "@shopify/polaris";
import ShopIntegrationForm from "../components/HomePage/ShopIntegrationForm";
import ShopIntegrationCard from "../components/HomePage/ShopIntegrationCard";

import type {ActionFunctionArgs, LoaderFunctionArgs} from "@remix-run/node";
import type {FastEditorShopSettings} from "../types/fastEditor.types";
import type {IntegrationActionData, IntegrationFormValues} from "../types/integration.types";
import {authenticate} from "../shopify.server";
import {billingRequire} from "../services/billing.server";
import {
  getFastEditorShopSettings,
  parseFormData,
  setupFastEditorIntegration,
  validateFormData
} from "../services/fastEditorFactory.server";
import {createOrderMetafieldDefinition} from "../services/metafield.server";

const ENDPOINT = "/app/_index";

export const loader = async (
  {request}: LoaderFunctionArgs
): Promise<Response | FastEditorShopSettings> => {
  const {admin, billing, session} = await authenticate.admin(request);
  await billingRequire(admin, billing, session.shop);

  try {
    const shopSettings = await getFastEditorShopSettings(session.shop)

    return {
      fastEditorApiKey: shopSettings?.fastEditorApiKey ?? "",
      fastEditorDomain: shopSettings?.fastEditorDomain ?? "",
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error(`[${ENDPOINT}] Loader error:`, errorMessage);
    return new Response(errorMessage,
      {status: 200}
    );
  }
};

export const action = async ({request}: ActionFunctionArgs): Promise<any> => {
  const {admin, session} = await authenticate.admin(request);

  try {
    console.info(`[${ENDPOINT}] FastEditor API integration request for shop ${session.shop}`);
    const {apiKey, apiDomain} = await parseFormData(request);
    const errors = validateFormData(apiKey, apiDomain);

    if (Object.keys(errors).length > 0) {
      return new Response(JSON.stringify({
          statusCode: 400,
          statusText: "Validation errors",
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

    await setupFastEditorIntegration(admin, session.shop, apiKey, apiDomain);

    await createOrderMetafieldDefinition(admin)

    return new Response(JSON.stringify({
        statusCode: 200,
        statusText: "FastEditor integration is successful.",
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
  const {fastEditorApiKey, fastEditorDomain} = useLoaderData<FastEditorShopSettings>()
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
      shopify.toast.show(fetcher.data.statusText);
    } else {
      shopify.toast.show("Connection to FastEditor failed. Please check your API Key and Domain and try again.");
    }

    if (!fetcher.data?.ok) {
      setFastEditorError(true);
    } else {
      setFastEditorError(false);
    }

    setApiKeyError(!!formErrors?.apiKey);
    setApiDomainError(!!formErrors?.apiDomain);
  }, [fetcher.state, fetcher.data]);

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

  return (
    <Page fullWidth>
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
