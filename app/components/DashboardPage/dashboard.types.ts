export interface ProductVariant {
  id: string;
  legacyResourceId: string;
  title: string;
  sku: string | null;
  price: string;
  inventoryQuantity: number | null;
  image?: {
    url?: string;
    altText?: string;
  } | null;
}

export interface Product {
  id: string;
  title: string;
  legacyResourceId: string;
  featuredMedia?: {
    preview: {
      image: {
        url?: string;
        altText?: string;
      };
    };
  };
  variants: {
    nodes: ProductVariant[];
  };
}

export interface ShopData {
  name: string;
  locale: string | null;
  currency: string | null;
}

export interface DashboardLoader {
  productsData: {
    edges: { node: Product }[];
    pageInfo: {
      hasNextPage: boolean;
      hasPreviousPage: boolean;
      startCursor: string | null;
      endCursor: string | null;
    };
  };
  shopData: ShopData;
  productsLimit: number;
}
