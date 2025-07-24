export interface FastEditorShopSettings {
  fastEditorApiKey: string;
  fastEditorDomain: string;
}

export interface FastEditorIntegrationData {
  URL: string;
}

export interface ProductDataFromFastEditor {
  projectKey: number;
  quantity: number;
  customAttributes: {
    variantId?: string;
    [key: string]: any;
  };
  imageUrl: string;
}

export interface FastEditorOrderItem {
  projectKey: string;
  orderItemId: string;
  quantity: number;
  totalSaleValue: number;
}
