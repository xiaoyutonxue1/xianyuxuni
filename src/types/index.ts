export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  store: string;
  status: 'pending' | 'selling' | 'draft';
  listingDate: string;
  shippingMethod: string;
  stock: number;
  price: number;
  originalPrice: number;
  mainImage: string;
  commonImages: string[];
  crawlerStatus?: 'pending' | 'completed' | 'none';
  lastUpdated: string;
}

export interface Template {
  id: string;
  name: string;
  content: string;
  storeId: string;
  isDefault: boolean;
}

export interface Store {
  id: string;
  name: string;
  shippingInfo: ShippingInfo;
  productTemplates?: Template[];
}

export interface ShippingInfo {
  method: string;
  address: string;
  details: Record<string, any>;
}