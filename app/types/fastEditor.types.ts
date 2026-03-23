import type {PricingRuleExtraCharge} from "./pricingRules.types";

export interface FastEditorIntegrationData {
  URL: string;
}

export interface ProductDataFromFastEditor {
  sku?: string;
  projectId?: number;
  projectKey: number;
  pages?: number;
  quantity: number;
  price?: number;
  currency?: string;
  country?: string;
  isQuantityMutable?: boolean;
  language?: string;
  customAttributes: {
    variantId?: string;
    [key: string]: unknown;
  };
  imageUrl: string;
  addOnId?: string | number | null;
  addOnQuantity?: number | null;
}

export interface FastEditorOrderItem {
  projectKey: string;
  orderItemId: string;
  quantity: number;
  totalSaleValue: number;
}

export interface FastEditorResolvedProductData {
  variantId: string;
  quantity: number;
  projectKey: number;
  imageUrl: string;
  customAttributes: ProductDataFromFastEditor["customAttributes"];
  pages: number | null;
  extraPages: number;
  addOnQuantity: number | null;
  price: number | null;
  currency: string | null;
  extraPricing: PricingRuleExtraCharge | null;
}
