import type {Products} from "./products.types";

interface ShopSettings {
  locale: string | null;
  currency: string | null;
  fastEditorApiKey: string | null;
  fastEditorDomain: string | null;
}

export interface DashboardData {
  productsData: Products;
  shopName: string;
  shopSettings: ShopSettings;
  productsLimit: number;
}
