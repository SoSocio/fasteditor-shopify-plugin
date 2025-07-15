import {useCallback, useEffect, useState} from "react";
import {useFetcher, useLoaderData} from "@remix-run/react";
import {BlockStack, Layout, Page,} from "@shopify/polaris";
import {authenticate} from "../shopify.server";
import type {ActionFunctionArgs, LoaderFunctionArgs} from "@remix-run/node";
import type {
  ActionData,
  ErrorsData,
  FormValues,
  LoaderData
} from "../components/HomePage/ShopIntegrationForm.types";
import {fastEditorIntegration, getFastEditorAPIForShop} from "../services/fastEditorFactory.server";
import ShopIntegrationForm from "../components/HomePage/ShopIntegrationForm";
import ShopIntegrationCard from "../components/HomePage/ShopIntegrationCard";
import {billingCheck, billingRequire} from "../services/billing.server";

const ENDPOINT = "/app/_index";

export const loader = async ({request}: LoaderFunctionArgs) => {
  const {admin, billing, session} = await authenticate.admin(request);
  await billingRequire(admin, billing, session.shop);

  try {
    const subscription = await billingCheck(billing)
    console.log(`[${ENDPOINT}] Loader subscription:`, subscription);

    const fasteditorIntegration = await getFastEditorAPIForShop(session.shop)
    console.log(`[${ENDPOINT}] Loader fasteditorIntegration:`, fasteditorIntegration);

    return {
      hasActivePayment: subscription.hasActivePayment,
      appSubscriptions: subscription.appSubscriptions,
      fasteditorIntegration,
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
    console.log(`[${ENDPOINT}] FastEditor API integration request for shop ${session.shop}`);
    const formData = await request.formData();

    const apiKey = String(formData.get("apiKey")) || "";
    const apiDomain = String(formData.get("apiDomain")) || "";

    const errorsData: ErrorsData = {};
    if (apiKey === "") {
      errorsData.apiKey = "API Key is required";
    }
    if (apiDomain === "") {
      errorsData.apiDomain = "API Domain is required";
    }

    if (Object.keys(errorsData).length > 0) {
      return new Response(JSON.stringify({
          statusCode: 400,
          statusText: "Validation errors",
          body: {errors: errorsData},
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

    await fastEditorIntegration(admin, session.shop, apiKey, apiDomain);
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

export default function Index() {
  const {fasteditorIntegration} = useLoaderData<LoaderData>()
  const fetcher = useFetcher<ActionData>();
  const [formValues, setFormValues] = useState<FormValues>({
    apiKey: fasteditorIntegration?.apiKey ?? "",
    apiDomain: fasteditorIntegration?.domain ?? "",
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
            <ShopIntegrationCard integration={fasteditorIntegration}>
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
