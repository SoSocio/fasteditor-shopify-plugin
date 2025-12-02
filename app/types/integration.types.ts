import type {ReactNode} from "react";

export interface IntegrationFormValues {
  apiKey: string;
  apiDomain: string;
}

export interface IntegrationErrorsData {
  apiKey?: string;
  apiDomain?: string;
}

export interface IntegrationActionData {
  statusCode: number;
  statusText: string;
  ok: boolean;
  body?: {
    errors?: IntegrationErrorsData;
  };
}

export interface IntegrationFormProps {
  formValues: IntegrationFormValues;
  handleChange: (field: keyof IntegrationFormValues) => (value: string) => void;
  handleSubmit: () => void;
  isApiKeyError: boolean;
  isApiDomainError: boolean;
  errors?: IntegrationErrorsData;
  fastEditorError: boolean;
  isLoading?: boolean;
}

export interface IntegrationCardProps {
  fastEditorApiKey: string | null;
  fastEditorDomain: string | null;
  children?: ReactNode;
}
