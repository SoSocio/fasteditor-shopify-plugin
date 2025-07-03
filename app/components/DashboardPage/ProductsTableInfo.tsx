import React from "react";
import {BlockStack, List, Text, InlineCode} from "@shopify/polaris";

export const ProductsTableInfo = () => {
  return (
    <BlockStack gap="200">
      <Text as="h2" variant="headingMd">Products with the FastEditor tag</Text>
      <BlockStack gap="100">
        <Text as="p" variant="bodyMd">
          The table below shows products tagged with <InlineCode>fasteditor</InlineCode>.
        </Text>
        <Text as="h3" variant="headingSm">
          To tag a product:
        </Text>
        <List type="bullet">
          <List.Item>Go to <strong>Products</strong></List.Item>
          <List.Item>Select a product</List.Item>
          <List.Item>In the Tags section, enter <strong>fasteditor</strong> and
            press <strong>Enter</strong></List.Item>
          <List.Item>Click <strong>Save</strong></List.Item>
        </List>
      </BlockStack>
    </BlockStack>
  );
}
