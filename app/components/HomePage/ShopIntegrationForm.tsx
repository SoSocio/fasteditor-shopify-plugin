import React from "react";
import {BlockStack, Button, Form, FormLayout, InlineError, TextField} from "@shopify/polaris";
import type {IntegrationFormProps} from "../../types/integration.types";

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

  return (
    <Form onSubmit={handleSubmit}>
      <FormLayout>
        <BlockStack gap="400">
          <BlockStack gap="200">
            <TextField
              id="apiKey"
              type="text"
              label="API Key"
              value={formValues.apiKey}
              onChange={handleChange("apiKey")}
              autoComplete="off"
              error={isApiKeyError}
            />
            <InlineError
              fieldID="apiKey"
              message={isApiKeyError ? errors?.apiKey : ""}
            />
          </BlockStack>
          <BlockStack gap="200">
            <TextField
              id="apiDomain"
              type="text"
              label="API Domain"
              value={formValues.apiDomain}
              onChange={handleChange("apiDomain")}
              autoComplete="off"
              error={isApiDomainError}
            />
            <InlineError
              fieldID="apiDomain"
              message={isApiDomainError ? errors?.apiDomain : ""}
            />
          </BlockStack>
          <InlineError
            fieldID=""
            message={fastEditorError ? "Connection to FastEditor failed. Please check your API Key and Domain and try again." : ""}
          />
        </BlockStack>
        <Button submit>Connect</Button>
      </FormLayout>
    </Form>
  );
};
export default ShopIntegrationForm;
