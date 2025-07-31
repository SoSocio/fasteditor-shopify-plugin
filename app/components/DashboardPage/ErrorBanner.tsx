import {Banner, BlockStack, List, Text} from "@shopify/polaris";
import React from "react";

export const ErrorBanner = () => {
  return (
    <Banner
      title="We couldn't load your dashboard data"
      action={{ content: "Back to Getting Started", url: "/app" }}
      secondaryAction={{ content: "Check Integration Settings", url: "/app/settings" }}
      tone="warning"
    >
      <BlockStack gap="200">
        <Text as="p">
          The error may have occurred due to one of the following reasons:
        </Text>
        <List>
          <List.Item>
            FastEditor integration is not yet completed. Please enter your API key and domain in the
            Integration tab.
          </List.Item>
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
