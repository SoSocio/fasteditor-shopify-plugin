import { useFetcher } from "@remix-run/react";
import { Modal, TitleBar } from "@shopify/app-bridge-react";
import { BlockStack, Box, Text } from "@shopify/polaris";
import { useTranslation } from "react-i18next";

/**
 * Modal component for confirming subscription cancellation.
 * Uses Shopify native modal API via ui-modal element.
 */
export const CancelSubscriptionModal = () => {
  const { t } = useTranslation();
  const fetcher = useFetcher();
  const handleCancelSubscription = () => {
    try {
      fetcher.submit(
        null,
        {method: "POST", action: "/app/subscription/cancel"}
      );
      shopify.toast.show(t("subscription-page.cancel-modal.success-message"));
    } catch (error) {
      shopify.toast.show(t("subscription-page.cancel-modal.error-message"));
    }
  }
  return (
    <Modal id="cancelSubscriptionModal">
      <Box padding="400">
        <BlockStack gap="200">
          <Text as="p" variant="headingMd">
            {t("subscription-page.cancel-modal.confirm-question")}
          </Text>
          <Text as="p" variant="bodyMd">
            {t("subscription-page.cancel-modal.confirm-description")}
          </Text>
        </BlockStack>
      </Box>
      <TitleBar title={t("subscription-page.cancel-modal.title")}>
        <button variant="primary" onClick={handleCancelSubscription}>{t("subscription-page.cancel-modal.cancel-button")}</button>
        <button onClick={() => shopify.modal.hide("cancelSubscriptionModal")}>{t("subscription-page.cancel-modal.keep-button")}</button>
      </TitleBar>
    </Modal>
  );
};

