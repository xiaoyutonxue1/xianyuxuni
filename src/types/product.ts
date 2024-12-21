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
  stock: number;
  deliveryMethod: DeliveryMethod;
  deliveryInfo: string;
}

// 选品状态类型
export type ProductSelectionStatus = 
  | 'pending'           // 待分配
  | 'distributed'       // 已分配
  | 'inactive';         // 已下架

// 选品创建状态类型
export type ProductSourceStatus =
  | 'manual'           // 手动创建
  | 'crawler_pending'  // 待爬虫
  | 'crawler_running'  // 爬虫进行中
  | 'crawler_success'  // 爬虫成功
  | 'crawler_failed'   // 爬虫失败
  | 'inactive';        // 已下架

// 选品基础信息
export interface ProductSelection {
  id: string;
  name: string;
  category: ProductCategory;
  description: string;
  keywords?: string[];
  remark?: string;
  price: number;
  stock: number;
  createdAt: string;
  status: ProductSelectionStatus;
  source: 'manual' | 'crawler';
  hasSpecs: boolean;
  specs?: ProductSpec[];
  deliveryMethod?: DeliveryMethod;
  deliveryInfo?: string;
  productUrl?: string;
  errorMessage?: string;
  completeness?: number;
  distributedAt?: string;
  coverImage?: string;
  source_status: ProductSourceStatus;  // 创建状态
}

// 商品状态类型
export type ProductStatus = 
  | 'draft'      // 草稿
  | 'pending'    // 待发布
  | 'published'  // 已发布
  | 'failed'     // 发布失败
  | 'offline';   // 已下架

// 商品分配状态
export type DistributeStatus = 
  | 'draft'      // 草稿
  | 'pending'    // 待发布
  | 'published'  // 已发布
  | 'failed'     // 发布失败
  | 'offline';   // 已下架

// 完整的商品信息(从选品分配后生成)
export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  description: string;
  keywords?: string[];
  remark?: string;
  price: number;
  stock: number;
  createdAt: string;
  source: 'manual' | 'crawler';
  hasSpecs: boolean;
  specs?: ProductSpec[];
  deliveryMethod?: DeliveryMethod;
  deliveryInfo?: string;
  productUrl?: string;
  errorMessage?: string;
  completeness?: number;
  selectionId: string;           // 关联的选品ID
  storeId: string;              // 关联的店铺ID
  templateId: string;           // 使用的模板ID
  distributedTitle: string;     // 使用模板后的标题
  distributedContent: string;   // 使用模板后的文案
  status: ProductStatus;        // 商品状态
  distributedAt: string;       // 分配时间
  publishedAt?: string;        // 发布时间
  lastUpdated: string;         // 最后更新时间
  coverImage?: string;         // 商品头图
}

// 创建选品请求
export interface CreateSelectionRequest {
  id?: string;  // 编辑时使用
  name: string;
  category: ProductCategory;
  description: string;
  keywords?: string[];
  remark?: string;
  price: number;
  stock: number;
  source: 'manual' | 'crawler';
  hasSpecs: boolean;
  specs?: Omit<ProductSpec, 'id'>[];
  deliveryMethod?: DeliveryMethod;
  deliveryInfo?: string;
  productUrl?: string;
  coverImage?: string;
  method: 'manual' | 'crawler';
}

// 分配选品请求
export interface DistributeSelectionRequest {
  selectionId: string;
  storeIds: string[];
}

// 商品销售信息(单规格)
export interface ProductSaleInfo {
  price: number;
  originalPrice: number;
  stock: number;
  deliveryMethod: DeliveryMethod;
  deliveryInfo?: string;
}

// 商品分配信息
export interface DistributeInfo {
  storeId: string;
  templateId: string;
  status: DistributeStatus;
  distributedAt: string;
  publishedAt?: string;
  errorMessage?: string;
  distributedTitle?: string;    // 使用模板后的标题
  distributedContent?: string;  // 使用模板后的文案
}

// 更新商品请求
export interface UpdateProductRequest extends Partial<CreateSelectionRequest> {
  id: string;
} 