import type {ReactNode} from "react";
import type {FastEditorDomainType} from "../utils/fastEditorDomain";

export interface IntegrationFormValues {
  apiKey: string;
  fastEditorDomain: string;
  customDomain: string;
  activeDomainType: FastEditorDomainType;
}

export interface IntegrationErrorsData {
  apiKey?: string;
  fastEditorDomain?: string;
  customDomain?: string;
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
  handleDomainTypeChange: (selected: string[]) => void;
  handleSubmit: () => void;
  isApiKeyError: boolean;
  isFastEditorDomainError: boolean;
  isCustomDomainError: boolean;
  errors?: IntegrationErrorsData;
  fastEditorError: boolean;
  isLoading?: boolean;
}

export interface IntegrationCardProps {
  fastEditorApiKey: string | null;
  fastEditorDomain: string | null;
  children?: ReactNode;
}
