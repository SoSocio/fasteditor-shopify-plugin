import React from 'react';
import {Badge, BlockStack, Box, Card, Text} from "@shopify/polaris";
import type {IntegrationCardProps} from "../../types/integration.types";
import { useTranslation } from "react-i18next";


const ShopIntegrationCard: React.FC<IntegrationCardProps> = (
  {
    fastEditorApiKey,
    fastEditorDomain,
    children
  }) => {
  const { t } = useTranslation();

  return (
    <Card>
      <BlockStack gap="400">
        <Box>
          {fastEditorApiKey && fastEditorDomain ?
            <Badge tone="success" size="large">{t("settings-page.integration-card.connected-badge")}</Badge> :
            <Badge size="large">{t("settings-page.integration-card.not-connected-badge")}</Badge>
          }
        </Box>
        <BlockStack gap="200">
          <Text as="h3" variant="headingMd">{t("settings-page.integration-card.title")}</Text>
          <Text as="p" variant="bodyMd">
            <span dangerouslySetInnerHTML={{ __html: t("settings-page.integration-card.description") }} />
          </Text>
        </BlockStack>
        {children}
      </BlockStack>
    </Card>
  );
};

export default ShopIntegrationCard;
