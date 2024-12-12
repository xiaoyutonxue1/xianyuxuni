export interface ProductSpec {
  id: string;
  name: string;
  price: string;
  originalPrice: string;
  stock: number;
  deliveryMethod: string;
}

export interface ProductListingItem {
  id: number;
  name: string;
  store: string;
  category: string;
  status: 'draft' | 'selling' | 'offline';
  price: string;
  originalPrice: string;
  stock: number;
  sales: number;
  updatedAt: string;
  createdAt: string;
  lastUpdateBy: string;
  specs?: ProductSpec[];
  headImage?: string;
  publicImages?: string[];
  distributedTo?: string[];
  description?: string;
  keywords?: string[];
  remark?: string;
  method: 'crawler' | 'manual';
  crawlerStatus?: 'pending' | 'processing' | 'processed' | 'failed';
  source?: string;
  sourceUrl?: string;
  processStep?: number;
  failReason?: string;
} 