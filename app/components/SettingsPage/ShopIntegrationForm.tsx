import React from "react";
import {BlockStack, Button, Form, FormLayout, InlineError, TextField} from "@shopify/polaris";
import type {IntegrationFormProps} from "../../types/integration.types";
import { useTranslation } from "react-i18next";

const ShopIntegrationForm: React.FC<IntegrationFormProps> = (
  {
    formValues,
    handleChange,
    handleSubmit,
    isApiKeyError,
    isApiDomainError,
    errors,
    fastEditorError
  }
) => {
  const { t } = useTranslation();

  return (
    <Form onSubmit={handleSubmit}>
      <FormLayout>
        <BlockStack gap="400">
          <BlockStack gap="200">
            <TextField
              id="apiKey"
              type="text"
              label={t("settings-page.integration-form.api-key-label")}
              value={formValues.apiKey}
              onChange={handleChange("apiKey")}
              autoComplete="off"
              error={isApiKeyError}
            />
            <InlineError
              fieldID="apiKey"
              message={isApiKeyError && errors?.apiKey ? t(`settings-page.integration-form.validation-errors.${errors.apiKey}`) : ""}
            />
          </BlockStack>
          <BlockStack gap="200">
            <TextField
              id="apiDomain"
              type="text"
              label={t("settings-page.integration-form.api-domain-label")}
              value={formValues.apiDomain}
              onChange={handleChange("apiDomain")}
              autoComplete="off"
              error={isApiDomainError}
            />
            <InlineError
              fieldID="apiDomain"
              message={isApiDomainError && errors?.apiDomain ? t(`settings-page.integration-form.validation-errors.${errors.apiDomain}`) : ""}
            />
          </BlockStack>
          <InlineError
            fieldID=""
            message={fastEditorError ? t("settings-page.integration-form.connection-failed-error") : ""}
          />
        </BlockStack>
        <Button submit>{t("settings-page.integration-form.connect-button")}</Button>
      </FormLayout>
    </Form>
  );
};
export default ShopIntegrationForm;
