import {Banner, BlockStack, List} from "@shopify/polaris";
import React from "react";

export const ErrorBanner = () => {
  return (
    <Banner
      title="We couldn't load your dashboard data"
      action={{ content: "Return", url: "/app/dashboard" }}
      tone="warning"
    >
      <BlockStack gap="200">
        <List>
          <List.Item>
            The data couldn't be found based on your current filters.
          </List.Item>
          <List.Item>
            If the issue persists, try refreshing the page or contact support.
          </List.Item>
        </List>
      </BlockStack>
    </Banner>
  );
};
