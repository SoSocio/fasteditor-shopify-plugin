import {useCallback, useEffect, useState} from "react";
import type {ActionFunctionArgs, LoaderFunctionArgs} from "@remix-run/node";
import {useFetcher, useLoaderData} from "@remix-run/react";
import {Badge, BlockStack, Card, Layout, Page,} from "@shopify/polaris";
import {TitleBar} from "@shopify/app-bridge-react";
import {authenticate} from "../shopify.server";
import ShopIntegrationForm from "../components/HomePage/ShopIntegrationForm";
import {getFastEditorAPIForShop} from "../services/fastEditorFactory.server";
import {fastEditorIntegration} from "../services/fastEditorIntegration";


interface FastEditorIntegration {
  apiKey: string;
  domain: string;
}

interface LoaderData {
  hasActivePayment: boolean;
  appSubscriptions: unknown[];
  fasteditorIntegration?: FastEditorIntegration;
}

interface ErrorsData {
  apiKey?: string;
  apiDomain?: string;
}

interface ActionData {
  statusCode: number;
  statusText: string;
  ok: boolean;
  body?: {
    errors?: ErrorsData;
  };
}

interface FormValues {
  apiKey: string;
  apiDomain: string;
}

export const loader = async ({request}: LoaderFunctionArgs) => {
  const {billing, session} = await authenticate.admin(request);
  const {hasActivePayment, appSubscriptions} = await billing.check();

  const fasteditorIntegration = await getFastEditorAPIForShop(session.shop)

  console.log("hasActivePayment", hasActivePayment);
  console.log("appSubscriptions", appSubscriptions);

  return Response.json({
    hasActivePayment,
    appSubscriptions,
    fasteditorIntegration,
  });
};

export const action = async ({request}: ActionFunctionArgs) => {
  const {session} = await authenticate.admin(request);
  try {
    console.log("FastEditor API integration request");
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
      return Response.json({
        statusCode: 400,
        statusText: "Validation errors",
        body: {errors: errorsData},
        ok: false
      });
    }

    await fastEditorIntegration(session, apiKey, apiDomain);
    return Response.json({
        statusCode: 200,
        statusText: "FastEditor integration is successful",
        ok: true
      },
      {status: 200}
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error("FastEditor integration failed", errorMessage);
    return Response.json({
        statusCode: 500,
        statusText: errorMessage,
        ok: false
      },
      {status: 200}
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

  useEffect(() => {
    if (fetcher.state !== "idle" || !fetcher.data) return;

    if (fetcher.data?.ok) {
      shopify.toast.show(fetcher.data.statusText);
    } else {
      shopify.toast.show("FastEditor integration failed. Please check entered values.");
    }

    setApiKeyError(!!fetcher.data?.body?.errors?.apiKey);
    setApiDomainError(!!fetcher.data?.body?.errors?.apiDomain);
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

  // const generateProduct = () => fetcher.submit({}, {method: "POST"});

  return (
    <Page fullWidth>
      <TitleBar title="FastEditor">
        {/*<button variant="primary" onClick={generateProduct}>*/}
        {/*  Generate a product*/}
        {/*</button>*/}
      </TitleBar>
      <BlockStack gap="500">
        {fasteditorIntegration &&
          <Layout>
            <Layout.Section>
              <Card>
                <Badge tone="success">Active</Badge>
              </Card>
            </Layout.Section>
          </Layout>
        }
        <Layout>
          <Layout.Section>
            <ShopIntegrationForm
              handleChange={handleChange}
              handleSubmit={handleSubmit}
              formValues={formValues}
              isApiKeyError={isApiKeyError}
              isApiDomainError={isApiDomainError}
              errors={fetcher.data?.body?.errors}
            />
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}
