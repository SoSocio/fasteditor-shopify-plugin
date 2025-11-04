export interface ShopInfo {
  countryCode: string;
  currency: string;
}

export interface Shop {
  shop: string;
}

export interface ShopSettingsCore {
  country: string | null;
  currency: string | null;
  trialStartDate: Date | null;
  trialEndDate: Date | null;
}

export interface IntegrationShopSettings {
  fastEditorApiKey: string | null;
  fastEditorDomain: string | null;
}
