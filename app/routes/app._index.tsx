import {useCallback, useEffect, useState} from "react";
import type {ActionFunctionArgs, LoaderFunctionArgs} from "@remix-run/node";
import {data, useFetcher} from "@remix-run/react";
import {Badge, BlockStack, Card, Layout, Page,} from "@shopify/polaris";
import {TitleBar} from "@shopify/app-bridge-react";
import {authenticate} from "../shopify.server";
import ShopIntegrationForm from "../components/HomePage/ShopIntegrationForm";

export const loader = async ({request}: LoaderFunctionArgs) => {
  const {billing} = await authenticate.admin(request);
  const {hasActivePayment, appSubscriptions} = await billing.check();

  console.log(hasActivePayment, appSubscriptions);

  return data({hasActivePayment, appSubscriptions});
};

export const action = async ({request}: ActionFunctionArgs) => {

  try {
    const formData = await request.formData();

    const apiKey = String(formData.get("apiKey")) || "";
    const apiDomain = String(formData.get("apiDomain")) || "";
    console.log("apiKey", apiKey, "apiDomain", apiDomain)

    const errorsData = {};
    if (apiKey === "") {
      errorsData.apiKey = "API Key is required";
    }
    if (apiDomain === "") {
      errorsData.apiDomain = "API Domain is required";
    }
    if (Object.keys(errorsData).length > 0) {
      return Response.json({errors: errorsData})
    }

    // const fastEditorAPI = new FastEditorAPI(apiKey, apiDomain);
    //
    // const response = await fastEditorAPI.checkShopIntegration();
    //
    // if (!response.ok) {
    //   return Response.json(response, {error: "Something went wrong:"})
    // }
    //
    // const upsertShopSettings = await db.shopsettings.upsert({
    //   where: {
    //     shop: session.shop,
    //   },
    //   update: {
    //     fastEditorApiKey: updateJson.user,
    //     fastEditorDomain: updateJson.api_token,
    //   },
    //   create: {
    //     shop: "",
    //     shopifySubscriptionId: "",
    //     subscriptionStatus: "",
    //     subscriptionCurrentPeriodEnd: "",
    //     fastEditorApiKey: "",
    //     fastEditorDomain: "",
    //     createdAt: "",
    //     updatedAt: ""
    //   },
    // });
    //
    // console.log("upsertShopSettings", upsertShopSettings)
    //
    // console.log("FastEditor products:", response);
    return Response.json({success: true, products: []})
  } catch (error) {
    console.error("Something went wrong:", error);
    return data({success: false, error: error instanceof Error ? error.message : String(error)});
  }
};


export default function Index() {
  const fetcher = useFetcher<typeof action>();
  const [formValues, setFormValues] = useState({
    apiKey: "",
    apiDomain: "",
  });
  const [isApiKeyError, setApiKeyError] = useState<boolean>(false);
  const [isApiDomainError, setApiDomainError] = useState<boolean>(false);

  useEffect(() => {
    if (fetcher.data?.success) {
      setFormValues({
        apiKey: "",
        apiDomain: "",
      });
    }
    if (fetcher.data?.errors?.apiKey) {
      setApiKeyError(true);
    } else {
      setApiKeyError(false);
    }
    if (fetcher.data?.errors?.apiDomain) {
      setApiDomainError(true);
    } else {
      setApiDomainError(false);
    }
  }, [fetcher.data]);

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


  // const { hasActivePayment, appSubscriptions } = useLoaderData<typeof loader>();

  // const shopify = useAppBridge();
  //
  // useEffect(() => {
  //   shopify.toast.show("Product created");
  // }, [shopify]);

  const generateProduct = () => fetcher.submit({}, {method: "POST"});

  return (
    <Page fullWidth>
      <TitleBar title="FastEditor">
        <button variant="primary" onClick={generateProduct}>
          Generate a product
        </button>
      </TitleBar>
      <BlockStack gap="500">
        {fetcher.data?.success &&
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
              errors={fetcher.data?.errors}
            />
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}
