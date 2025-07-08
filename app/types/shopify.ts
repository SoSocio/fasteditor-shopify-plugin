export interface ShopifyLineItem {
  id: number;
  quantity: number;
  price: string;
  properties?: Array<{ name: string; value: string }>;
  product_id: number;
  variant_id: number | null;
}

export interface ShopifyAddress {
  name: string;
  address1: string;
  address2?: string;
  city: string;
  zip: string;
  country: string;
}

export interface ShopifyCustomer {
  email: string;
}

export interface ShopifyOrder {
  id: string;
  name: string;
  line_items: ShopifyLineItem[];
  billing_address: ShopifyAddress;
  shipping_address: ShopifyAddress;
  customer: ShopifyCustomer;
}
