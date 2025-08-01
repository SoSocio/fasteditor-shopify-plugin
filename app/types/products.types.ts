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
  status: string;
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

export interface PageInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor: string | null;
  endCursor: string | null;
}


export interface Products {
  edges: { node: Product }[];
  pageInfo: PageInfo;
}

export interface ProductsVariables {
  first?: number;
  after?: string;
  last?: number;
  before?: string;
  sortKey?: string;
  reverse?: boolean;
  query?: string;
}
