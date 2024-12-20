# 数据库设计文档

## 版本
v2.7.0

## 数据同步机制
### 选品分配与商品数据同步
- 当选品被分配到店铺时，系统会自动创建对应的商品数据
- 当取消店铺分配时，系统会自动删除对应的商品数据
- 商品ID生成规则：`${selectionId}-${storeId}`
- 分配状态变更时会自动更新选品的状态和分配时间

### 数据一致性保证
- 使用 selectionStore 作为选品数据的单一数据源
- 使用 productStore 管理商品数据，与选品数据保持同步
- 所有数据变更操作都通过 store 的方法进行，确保数据一致性

## 数据结构
### 选品 (Selection)
```typescript
interface Selection {
  id: string;                 // 选品ID
  name: string;               // 选品名称
  category: string;           // 分类
  price: number;             // 价格
  stock: number;             // 库存
  status: SelectionStatus;   // 状态
  createdAt: string;         // 创建时间
  description?: string;      // 描述
  source: 'manual' | 'crawler'; // 来源
  hasSpecs: boolean;         // 是否有规格
  specs?: ProductSpec[];     // 规格信息
  saleInfo?: ProductSaleInfo; // 销售信息
  distributedAt?: string;    // 分配时间
  lastUpdated: string;       // 最后更新时间
  coverImage?: string;       // 商品头图
}
```

### 商品 (Product)
```typescript
interface Product extends Selection {
  selectionId: string;       // 关联的选品ID
  storeId: string;          // 关联的店铺ID
  templateId: string;       // 使用的模板ID
  distributedTitle: string; // 使用模板后的标题
  distributedContent: string; // 使用模板后的文案
  status: ProductStatus;    // 商品状态
  distributedAt: string;   // 分配时间
  publishedAt?: string;    // 发布时间
  lastUpdated: string;     // 最后更新时间
  coverImage?: string;     // 商品头图
}
```

## 状态定义
### 选品状态 (SelectionStatus)
- pending: 待分配
- distributed: 已分配
- inactive: 已下架

### 商品状态 (ProductStatus)
- draft: 草稿
- pending: 待发布
- published: 已发布
- failed: 发布失败
- offline: 已下架

## 数据关系
### 选品与商品
- 一个选品可以分配给多个店铺，每个分配会创建一个独立的商品记录
- 商品通过 selectionId 和 storeId 与选品和店铺关联
- 取消分配时会删除对应的商品记录，但不会影响选品数据

### 店铺与模板
- 每个店铺可配置多个模板
- 必须指定一个默认模板用于商品创建
- 模板包含标题和描述的格式化规则

## 数据存储
### LocalStorage 键值定义
- selections: 选品数据列表
- products: 商品数据列表
- storeAccounts: 店铺账号配置
- storeGroups: 店铺分组配置

### 数据持久化
- 所有数据变更都会自动同步到 LocalStorage
- 页面刷新时会从 LocalStorage 恢复数据
- 使用 store 的方法进行数据操作，确保数据同步

## 系统设置表 (settings)

### 商品分类设置
```json
{
  "categories": [
    "学习资料",
    "日剧",
    "美剧",
    "漫画",
    "韩剧",
    "国内电视剧",
    "动漫",
    "电子书",
    "电影"
  ],
  "categorySettings": {
    "maxLength": 20,
    "allowCustom": false,
    "requireCategory": true
  }
}
```

### 发货方式设置
```json
{
  "deliveryMethods": [
    {
      "id": "baiduDisk",
      "name": "百度网盘链接",
      "isEnabled": true,
      "pattern": "^https?://pan\\.baidu\\.com/s/[a-zA-Z0-9_-]+$",
      "example": "https://pan.baidu.com/s/abc123"
    },
    // ... 其他发货方式
  ]
}
```

// ... existing code ... 