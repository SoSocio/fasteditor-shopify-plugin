import React from "react";
import {BlockStack, List, Text} from "@shopify/polaris";
import { useTranslation } from "react-i18next";

export const ProductsTableInfo = () => {
  const { t } = useTranslation();

  return (
    <BlockStack gap="200">
      <Text as="h2" variant="headingMd">
        {t("dashboard-page.products-table-info.title")}
      </Text>
      <BlockStack gap="100">
        <Text as="p" variant="bodyMd">
          <span dangerouslySetInnerHTML={{ __html: t("dashboard-page.products-table-info.description") }} />
        </Text>
        <Text as="h3" variant="headingSm">
          {t("dashboard-page.products-table-info.tag-instructions-title")}
        </Text>
        <List type="bullet">
          <List.Item>
            <span dangerouslySetInnerHTML={{ __html: t("dashboard-page.products-table-info.steps.item-1") }} />
          </List.Item>
          <List.Item>{t("dashboard-page.products-table-info.steps.item-2")}</List.Item>
          <List.Item>
            <span dangerouslySetInnerHTML={{ __html: t("dashboard-page.products-table-info.steps.item-3") }} />
          </List.Item>
          <List.Item>
            <span dangerouslySetInnerHTML={{ __html: t("dashboard-page.products-table-info.steps.item-4") }} />
          </List.Item>
        </List>
      </BlockStack>
    </BlockStack>
  );
}
