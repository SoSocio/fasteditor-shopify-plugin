export interface SmartLinkRequestData {
  shop: string;
  variantId: string;
  productHandle: string;
  quantity: number;
  userId?: string;
}

export interface SmartLinkShopSettings {
  language: string;
  country: string;
  currency: string;
  fastEditorApiKey: string;
  fastEditorDomain: string;
}

export interface SmartLinkPayload {
  language: string;
  country: string;
  currency: string;
  variantId: string;
  quantity: number;
  variantSKU: string;
  cartUrl: string;
  userId?: string;
}
