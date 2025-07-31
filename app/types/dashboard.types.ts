import type {PageInfo, Product} from "./products.types";

interface ShopSettings {
  locale: string | null;
  currency: string | null;
  fastEditorApiKey: string | null;
  fastEditorDomain: string | null;
}

export interface DashboardData {
  products: { node: Product }[];
  pageInfo: PageInfo;
  shopName: string;
  shopSettings: ShopSettings;
  productsLimit: number;
}
