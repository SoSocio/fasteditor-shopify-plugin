import {Card, EmptyState, Page, Text, Layout} from "@shopify/polaris";
import {useCallback, useState} from "react";
import {useRevalidator} from "@remix-run/react";
import { useTranslation } from "react-i18next";

const NoSubscriptionPage = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const revalidator = useRevalidator();
  const onSubscribe = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/app/subscription/create", {method: "POST"})
      // Subscription already active and re-synced on the server: reload loaders to unlock the app
      if (response.ok) revalidator.revalidate();
    } catch (error) {
      shopify.toast.show(t("no-subscription-page.error-message"));
    } finally {
      setLoading(false);
    }
  }, [t, revalidator])

  return (
    <Page>
      <Layout>
        <Layout.Section>
          <Card>
            <EmptyState
              heading={t("no-subscription-page.heading")}
              action={{
                content: t("no-subscription-page.activate-button"),
                onAction: async () => onSubscribe(),
                loading: loading,
              }}
              image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
            >
              <Text as="p">
                {t("no-subscription-page.description")}
              </Text>
            </EmptyState>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
};

export default NoSubscriptionPage;
