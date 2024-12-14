# 数据库设计文档

## 版本
v0.1.9

## 表结构

### products (商品表)
| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | string | 主键 |
| name | string | 商品名称 |
| category | enum | 商品分类 |
| price | decimal | 价格 |
| stock | integer | 库存 |
| description | text | 商品描述 |
| keywords | string[] | 关键词 |
| remark | string | 备注 |
| status | enum | 商品状态 |
| source | enum | 来源(manual/crawler) |
| createdAt | timestamp | 创建时间 |
| hasSpecs | boolean | 是否有规格 |
| specs | jsonb | 规格信息 |
| distributeInfo | jsonb[] | 分配信息数组 |
| completeness | integer | 完整度 |

### store_accounts (店铺账号表)
| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | string | 主键 |
| name | string | 店铺名称 |
| platform | string | 平台 |
| priceAdjustment | decimal | 价格调整系数 |
| productTemplates | jsonb[] | 商品模板数组 |
| createdAt | timestamp | 创建时间 |

### store_groups (店铺组表)
| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | string | 主键 |
| name | string | 组名称 |
| storeIds | string[] | 店铺ID数组 |
| createdAt | timestamp | 创建时间 |

## 枚举类型

### ProductCategory (商品分类)
- study: 学习资料
- japanese_drama: 日剧
- american_drama: 美剧
- manga: 漫画
- korean_drama: 韩剧
- chinese_drama: 国内电视剧
- anime: 动漫
- ebook: 电子书
- movie: 电影

### ProductStatus (商品状态)
- manual: 手动模式
- crawler_pending: 待爬虫
- crawler_running: 爬虫进行中
- crawler_success: 爬虫成功
- crawler_failed: 爬虫失败
- inactive: 已下架

### DistributeStatus (分配状态)
- draft: 草稿
- pending: 待发布
- published: 已发布
- failed: 发布失败
- offline: 已下架

### DeliveryMethod (发货方式)
- baiduDisk: 百度网盘链接
- baiduDiskGroup: 百度网盘群链接
- baiduDiskGroupCode: 百度网盘群口令
- quarkDisk: 夸克网盘链接
- quarkDiskGroup: 夸克网盘群链接

## JSON结构

### ProductSpec (商品规格)
```json
{
  "id": "string",
  "name": "string",
  "price": "decimal",
  "stock": "integer",
  "deliveryMethod": "enum(DeliveryMethod)",
  "deliveryInfo": "string"
}
```

### DistributeInfo (分配信息)
```json
{
  "storeId": "string",
  "templateId": "string",
  "status": "enum(DistributeStatus)",
  "distributedAt": "timestamp",
  "publishedAt": "timestamp?",
  "errorMessage": "string?",
  "distributedTitle": "string?",
  "distributedContent": "string?"
}
```

### ProductTemplate (商品模板)
```json
{
  "id": "string",
  "name": "string",
  "titleTemplate": "string",
  "contentTemplate": "string",
  "createdAt": "timestamp"
}
```

## 更新记录

### v0.1.9 (2024-03-12)
- 优化商品模板结构
  - 完善模板数据存储格式
  - 添加默认模板标识
  - 优化模板字段定义
- 改进数据一致性
  - 修复模板数据同步问题
  - 完善数据保存机制
  - 优化错误处理流程

### v0.1.8 (2024-03-11)
- 优化分配信息结构
  - distributeInfo改为数组类型,支持多店铺分配
  - 添加distributedTitle和distributedContent字段
  - 完善分配状态和错误信息记录
- 添加店铺组表
  - 支持店铺分组管理
  - 记录组内店铺ID数组

### v0.1.7 (2024-03-09)
- 添加商品模板结构
  - 支持标题和内容模板
  - 移除店铺标语字段
- 优化商品表结构
  - 添加完整度字段
  - 完善商品状态

### v0.1.6 (2024-03-08)
- 添加分配信息结构
  - 记录分配状态和时间
  - 支持错误信息记录

### v0.1.5 (2024-03-07)
- 完善商品表结构
  - 添加规格信息
  - 支持多种发货方式

### v0.1.4 (2024-03-06)
- 添加店铺账号表
  - 基础店铺信息
  - 价格调整系数

### v0.1.3 (2024-03-05)
- 初始化数据库结构
  - 创建商品表
  - 定义基础字段
``` 