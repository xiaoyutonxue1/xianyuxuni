// 商品分类类型
export type ProductCategory = 
  | 'study'           // 学习资料
  | 'japanese_drama'  // 日剧
  | 'american_drama'  // 美剧
  | 'manga'          // 漫画
  | 'korean_drama'   // 韩剧
  | 'chinese_drama'  // 国内电视剧
  | 'anime'          // 动漫
  | 'ebook'          // 电子书
  | 'movie';         // 电影

// 发货方式类型
export type DeliveryMethod = 
  | 'baiduDisk'          // 百度网盘链接
  | 'baiduDiskGroup'     // 百度网盘群链接
  | 'baiduDiskGroupCode' // 百度网盘群口令
  | 'quarkDisk'          // 夸克网盘链接
  | 'quarkDiskGroup';    // 夸克网盘群链接

// 商品规格
export interface ProductSpec {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  stock: number;
  deliveryMethod: DeliveryMethod;
  deliveryInfo?: string;
}

// 商品基础信息
export interface ProductBase {
  name: string;
  category: ProductCategory;
  store: string;
  description: string;
  keywords?: string[];
  remark?: string;
}

// 商品媒体信息
export interface ProductMedia {
  headImage?: string;
  publicImages?: string[];
}

// 商品销售信息(单规格)
export interface ProductSaleInfo {
  price: number;
  originalPrice: number;
  stock: number;
  deliveryMethod: DeliveryMethod;
  deliveryInfo?: string;
}

// 完整的商品信息
export interface Product extends ProductBase, ProductMedia {
  id: string;
  hasSpecs: boolean;
  specs?: ProductSpec[];
  saleInfo?: ProductSaleInfo;
  
  status: 'draft' | 'selling' | 'offline';
  method: 'manual' | 'crawler';
  createdAt: string;
  updatedAt: string;
  lastUpdateBy?: string;
  
  // 爬虫相关信息
  crawlerStatus?: 'pending' | 'processing' | 'success' | 'failed';
  source?: string;
  sourceUrl?: string;
  failReason?: string;
}

// 创建商品请求
export interface CreateProductRequest extends ProductBase, ProductMedia {
  hasSpecs: boolean;
  specs?: Omit<ProductSpec, 'id'>[];
  saleInfo?: ProductSaleInfo;
  method: 'manual' | 'crawler';
  sourceUrl?: string;
}

// 更新商品请求
export interface UpdateProductRequest extends Partial<CreateProductRequest> {
  id: string;
} 