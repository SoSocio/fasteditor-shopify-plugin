import {Banner, BlockStack, List} from "@shopify/polaris";
import { useTranslation } from "react-i18next";

export const ErrorBanner = () => {
  const { t } = useTranslation();

  return (
    <Banner
      title={t("dashboard-page.error-banner.title")}
      action={{ content: t("dashboard-page.error-banner.return-button"), url: "/app/dashboard" }}
      tone="warning"
    >
      <BlockStack gap="200">
        <List>
          <List.Item>
            {t("dashboard-page.error-banner.messages.item-1")}
          </List.Item>
          <List.Item>
            {t("dashboard-page.error-banner.messages.item-2")}
          </List.Item>
        </List>
      </BlockStack>
    </Banner>
  );
};
