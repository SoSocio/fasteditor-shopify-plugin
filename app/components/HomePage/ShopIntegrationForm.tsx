import React from "react";
import {Button, Form, FormLayout, InlineError, TextField} from "@shopify/polaris";

const ShopIntegrationForm = (
  {
    formValues,
    handleChange,
    handleSubmit,
    isApiKeyError,
    isApiDomainError,
    errors
  }
) => {

  return (
    <Form onSubmit={handleSubmit}>
      <FormLayout>
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
        <Button submit>Submit</Button>
      </FormLayout>
    </Form>
  );
};
export default ShopIntegrationForm;
