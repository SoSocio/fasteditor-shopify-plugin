export interface SmartLinkRequestData {
  shop: string;
  variantId: string;
  productHandle: string;
  quantity: number;
}

export interface SmartLinkShopSettings {
  id: string;
  language: string;
  country: string;
  currency: string;
  fastEditorApiKey: string;
  fastEditorDomain: string;
}

export interface SmartLinkPayload {
  id: string;
  language: string;
  country: string;
  currency: string;
  variantId: string;
  quantity: number;
  variantSKU: string;
  cartUrl: string;
}
