import React from 'react';
import {BlockStack, List, Text} from "@shopify/polaris";

export const UsageLimitBannerContent = () => {
  return (
    <BlockStack gap="200">
      <Text as="p">
        Your current usage has exceeded the allowed limit for this billing cycle. As a result,
        the application is temporarily unavailable.
      </Text>
      <List>
        <List.Item>
          Access to all app features is blocked until the usage limit is increased or the
          billing cycle resets.
        </List.Item>
        <List.Item>
          To restore access, please review your subscription plan or increase your usage limit
          in the settings.
        </List.Item>
      </List>
    </BlockStack>
  );
};
