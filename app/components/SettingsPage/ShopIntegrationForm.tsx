import React from "react";
import {BlockStack, Box, Button, ChoiceList, Form, FormLayout, InlineError, TextField} from "@shopify/polaris";
import type {IntegrationFormProps} from "../../types/integration.types";
import { useTranslation } from "react-i18next";

const ShopIntegrationForm: React.FC<IntegrationFormProps> = (
  {
    formValues,
    handleChange,
    handleDomainTypeChange,
    handleSubmit,
    isApiKeyError,
    isFastEditorDomainError,
    isCustomDomainError,
    errors,
    fastEditorError,
    isLoading = false
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
          <ChoiceList
            title={t("settings-page.integration-form.domain-source-label")}
            name="activeDomainType"
            selected={[formValues.activeDomainType]}
            onChange={handleDomainTypeChange}
            choices={[
              {
                label: t("settings-page.integration-form.domain-options.fasteditor.label"),
                value: "fasteditor",
                renderChildren: (isSelected) => isSelected ? (
                  <Box paddingBlockStart="200">
                    <TextField
                      id="fastEditorDomain"
                      type="text"
                      label={t("settings-page.integration-form.fasteditor-domain-label")}
                      value={formValues.fastEditorDomain}
                      onChange={handleChange("fastEditorDomain")}
                      autoComplete="off"
                      error={isFastEditorDomainError}
                    />
                    <InlineError
                      fieldID="fastEditorDomain"
                      message={isFastEditorDomainError && errors?.fastEditorDomain ? t(`settings-page.integration-form.validation-errors.${errors.fastEditorDomain}`) : ""}
                    />
                  </Box>
                ) : false,
              },
              {
                label: t("settings-page.integration-form.domain-options.custom.label"),
                value: "custom",
                renderChildren: (isSelected) => isSelected ? (
                  <Box paddingBlockStart="200">
                    <BlockStack gap="200">
                      <TextField
                        id="customDomain"
                        type="text"
                        label={t("settings-page.integration-form.custom-domain-label")}
                        value={formValues.customDomain}
                        onChange={handleChange("customDomain")}
                        autoComplete="off"
                        error={isCustomDomainError}
                      />
                      <InlineError
                        fieldID="customDomain"
                        message={isCustomDomainError && errors?.customDomain ? t(`settings-page.integration-form.validation-errors.${errors.customDomain}`) : ""}
                      />
                    </BlockStack>
                  </Box>
                ) : false,
              },
            ]}
          />
          <InlineError
            fieldID=""
            message={fastEditorError ? t("settings-page.integration-form.connection-failed-error") : ""}
          />
        </BlockStack>
        <Button submit loading={isLoading}>{t("settings-page.integration-form.connect-button")}</Button>
      </FormLayout>
    </Form>
  );
};
export default ShopIntegrationForm;
