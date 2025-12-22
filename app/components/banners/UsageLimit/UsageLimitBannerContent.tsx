import React from 'react';
import {BlockStack, List, Text} from "@shopify/polaris";
import { useTranslation } from "react-i18next";

export const UsageLimitBannerContent = () => {
  const { t } = useTranslation();

  return (
    <BlockStack gap="200">
      <Text as="p">
        {t("usage-limit-banner.description")}
      </Text>
      <List>
        <List.Item>
          {t("usage-limit-banner.list-item-1")}
        </List.Item>
        <List.Item>
          {t("usage-limit-banner.list-item-2")}
        </List.Item>
      </List>
    </BlockStack>
  );
};
