import {Card, EmptyState, Page, Text, Layout} from "@shopify/polaris";
import {useCallback, useState} from "react";

const NoSubscriptionPage = () => {
  const [loading, setLoading] = useState(false);
  const onSubscribe = useCallback(async () => {
    try {
      setLoading(true);
      await fetch("/app/subscription/create", {method: "POST"})
    } catch (error) {
      shopify.toast.show("Cant create Subscription");
    } finally {
      setLoading(false);
    }
  }, [])

  return (
    <Page>
      <Layout>
        <Layout.Section>
          <Card>
            <EmptyState
              heading="Activate your subscription to continue"
              action={{
                content: "Activate subscription",
                onAction: async () => onSubscribe(),
                loading: loading,
              }}
              image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
            >
              <Text as="p">
                To continue using FastEditor, please activate your monthly plan.
                You will be redirected to billing page to confirm your subscription.
              </Text>
            </EmptyState>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
};

export default NoSubscriptionPage;
