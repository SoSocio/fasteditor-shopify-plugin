import React from 'react';
import {Badge, BlockStack, Box, Card, Text} from "@shopify/polaris";
import type {ShopIntegrationCardProps} from "./ShopIntegrationForm.types";


const ShopIntegrationCard: React.FC<ShopIntegrationCardProps> = (
  {
    fastEditorApiKey,
    fastEditorDomain,
    children
  }) => {
  return (
    <Card>
      <BlockStack gap="400">
        <Box>
          {fastEditorApiKey && fastEditorDomain ?
            <Badge tone="success" size="large">Connected</Badge> :
            <Badge size="large">Not connected</Badge>
          }
        </Box>
        <BlockStack gap="200">
          <Text as="h3" variant="headingMd">Connect Your Store to FastEditor</Text>
          <Text as="p" variant="bodyMd">
            To connect your store with FastEditor, please enter the API Key and Domain provided to
            you below, then
            click <strong>Connect</strong>.
            If the connection is successful, you will see a confirmation message and the status will
            update
            to <strong>Connected</strong>.
          </Text>
        </BlockStack>
        {children}
      </BlockStack>
    </Card>
  );
};

export default ShopIntegrationCard;
