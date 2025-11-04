import { useFetcher } from "@remix-run/react";
import { Modal, TitleBar } from "@shopify/app-bridge-react";
import { BlockStack, Box, Text } from "@shopify/polaris";

/**
 * Modal component for confirming subscription cancellation.
 * Uses Shopify native modal API via ui-modal element.
 */
export const CancelSubscriptionModal = () => {
  const fetcher = useFetcher();
  const handleCancelSubscription = () => {
    try {
      fetcher.submit(
        null,
        {method: "POST", action: "/app/subscription/cancel"}
      );
      shopify.toast.show("Subscription cancelled successfully");
    } catch (error) {
      shopify.toast.show("Failed to cancel subscription");
    }
  }
  return (
    <Modal id="cancelSubscriptionModal">
      <Box padding="400">
        <BlockStack gap="200">
          <Text as="p" variant="headingMd">
            Are you sure you want to cancel your subscription?
          </Text>
          <Text as="p" variant="bodyMd">
            If you cancel your subscription, access to all paid features will be revoked, and you won't be able to use the remaining paid period.
          </Text>
        </BlockStack>
      </Box>
      <TitleBar title="Cancel Subscription">
        <button variant="primary" onClick={handleCancelSubscription}>Cancel Subscription</button>
        <button onClick={() => shopify.modal.hide("cancelSubscriptionModal")}>Keep Subscription</button>
      </TitleBar>
    </Modal>
  );
};

