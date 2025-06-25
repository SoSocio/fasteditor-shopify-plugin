import type {ReactNode} from "react";

export interface FormValues {
  apiKey: string;
  apiDomain: string;
}

export interface ErrorsData {
  apiKey?: string;
  apiDomain?: string;
}

export interface ShopIntegrationFormProps {
  formValues: FormValues;
  handleChange: (field: keyof FormValues) => (value: string) => void;
  handleSubmit: () => void;
  isApiKeyError: boolean;
  isApiDomainError: boolean;
  errors?: ErrorsData;
  fastEditorError: boolean;
}

export interface ShopIntegrationCardProps {
  integration?: {
    apiKey: string;
    domain: string;
  };
  children?: ReactNode;
}

export interface FastEditorIntegration {
  apiKey: string;
  domain: string;
}

export interface LoaderData {
  hasActivePayment: boolean;
  appSubscriptions: unknown[];
  fasteditorIntegration?: FastEditorIntegration;
}

export interface ActionData {
  statusCode: number;
  statusText: string;
  ok: boolean;
  body?: {
    errors?: ErrorsData;
  };
}
