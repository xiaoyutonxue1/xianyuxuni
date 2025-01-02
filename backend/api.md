# 虚拟商品管理系统API文档

## 目录

- [概述](#概述)
- [认证API](#认证api)
- [选品管理API](#选品管理api)
- [商品管理API](#商品管理api)
- [店铺管理API](#店铺管理api)
- [模板管理API](#模板管理api)
- [文件上传API](#文件上传api)

## 概述

### 基础信息

- 基础URL: `http://api.example.com/api/v1`
- 数据格式: JSON
- 字符编码: UTF-8

### 认证方式

所有API（除了登录和注册）都需要在请求头中携带Token：

```http
Authorization: Bearer <token>
```

### 通用响应格式

```typescript
interface ApiResponse<T> {
    code: number;      // 状态码
    data?: T;         // 响应数据
    message?: string; // 提示信息
    timestamp: number;// 时间戳
}
```

### 通用错误码

| 状态码 | 说明 | 处理建议 |
|--------|------|----------|
| 200 | 请求成功 | - |
| 400 | 请求参数错误 | 检查请求参数 |
| 401 | 未登录或token失效 | 重新登录 |
| 403 | 无权限 | 检查用户权限 |
| 404 | 资源不存在 | 检查请求路径 |
| 500 | 服务器内部错误 | 联系管理员 |

## 认证API

### 用户注册

注册新用户账号。

**请求URL**

```http
POST /auth/register
```

**请求参数**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| username | string | 是 | 用户名，长度4-20个字符 |
| password | string | 是 | 密码，长度6-20个字符 |
| email | string | 否 | 邮箱地址 |

**响应数据**

```typescript
interface RegisterResponse {
    id: number;       // 用户ID
    username: string; // 用户名
    email?: string;   // 邮箱
    createdAt: string;// 创建时间
}
```

**请求示例**

```bash
curl -X POST http://api.example.com/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123",
    "email": "test@example.com"
  }'
```

**响应示例**

```json
{
    "code": 200,
    "data": {
        "id": 1,
        "username": "testuser",
        "email": "test@example.com",
        "createdAt": "2025-01-01T08:00:00Z"
    },
    "message": "注册成功",
    "timestamp": 1704067200000
}
```

### 用户登录

登录并获取访问令牌。

**请求URL**

```http
POST /auth/login
```

**请求参数**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| username | string | 是 | 用户名 |
| password | string | 是 | 密码 |

**响应数据**

```typescript
interface LoginResponse {
    token: string;           // 访问令牌
    refreshToken: string;    // 刷新令牌
    user: {
        id: number;         // 用户ID
        username: string;   // 用户名
        role: string;      // 用户角色
    }
}
```

**请求示例**

```bash
curl -X POST http://api.example.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123"
  }'
```

**响应示例**

```json
{
    "code": 200,
    "data": {
        "token": "eyJhbGciOiJIUzI1NiIs...",
        "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
        "user": {
            "id": 1,
            "username": "testuser",
            "role": "user"
        }
    },
    "message": "登录成功",
    "timestamp": 1704067200000
}
```

### 用户登出

注销当前用户的登录状态。

**请求URL**

```http
POST /auth/logout
```

**请求头**

```http
Authorization: Bearer <token>
```

**响应数据**

无

**请求示例**

```bash
curl -X POST http://api.example.com/api/v1/auth/logout \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**响应示例**

```json
{
    "code": 200,
    "message": "登出成功",
    "timestamp": 1704067200000
}
```

### 刷新Token

使用刷新令牌获取新的访问令牌。

**请求URL**

```http
POST /auth/refresh-token
```

**请求参数**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| refreshToken | string | 是 | 刷新令牌 |

**响应数据**

```typescript
interface RefreshTokenResponse {
    token: string;        // 新的访问令牌
    refreshToken: string; // 新的刷新令牌
}
```

**请求示例**

```bash
curl -X POST http://api.example.com/api/v1/auth/refresh-token \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }'
```

**响应示例**

```json
{
    "code": 200,
    "data": {
        "token": "eyJhbGciOiJIUzI1NiIs...",
        "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
    },
    "message": "Token刷新成功",
    "timestamp": 1704067200000
}
```

## 选品管理API

### 获取选品列表

获取选品列表，支持分页、筛选和排序。

**请求URL**

```http
GET /selections
```

**查询参数**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| page | number | 否 | 页码，默认1 |
| pageSize | number | 否 | 每页数量，默认10 |
| status | string | 否 | 状态筛选(pending/distributed/inactive) |
| category | string | 否 | 分类筛选 |
| keyword | string | 否 | 关键词搜索(搜索名称和描述) |
| sortBy | string | 否 | 排序字段(createdAt/price/stock) |
| sortOrder | string | 否 | 排序方向(asc/desc) |

**响应数据**

```typescript
interface SelectionListResponse {
    items: Selection[];    // 选品列表
    total: number;        // 总数量
    page: number;         // 当前页码
    pageSize: number;     // 每页数量
}

interface Selection {
    id: number;           // 选品ID
    name: string;         // 名称
    category?: string;    // 分类
    price: number;        // 价格
    stock: number;        // 库存
    status: string;       // 状态
    source: string;       // 来源
    sourceUrl?: string;   // 来源链接
    coverImage?: string;  // 主图
    description?: string; // 描述
    hasSpecs: boolean;    // 是否有规格
    createdAt: string;    // 创建时间
    updatedAt: string;    // 更新时间
}
```

**请求示例**

```bash
curl -X GET "http://api.example.com/api/v1/selections?page=1&pageSize=10&status=pending&sortBy=createdAt&sortOrder=desc" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**响应示例**

```json
{
    "code": 200,
    "data": {
        "items": [
            {
                "id": 1,
                "name": "测试选品1",
                "category": "数码",
                "price": 99.99,
                "stock": 100,
                "status": "pending",
                "source": "manual",
                "coverImage": "http://example.com/images/1.jpg",
                "description": "这是一个测试选品",
                "hasSpecs": false,
                "createdAt": "2025-01-01T08:00:00Z",
                "updatedAt": "2025-01-01T08:00:00Z"
            }
        ],
        "total": 1,
        "page": 1,
        "pageSize": 10
    },
    "timestamp": 1704067200000
}
```

### 创建选品

创建新的选品。

**请求URL**

```http
POST /selections
```

**请求参数**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| name | string | 是 | 选品名称 |
| category | string | 否 | 分类 |
| price | number | 是 | 价格 |
| stock | number | 是 | 库存 |
| source | string | 是 | 来源(manual/crawler) |
| sourceUrl | string | 否 | 来源链接 |
| coverImage | string | 否 | 主图URL |
| description | string | 否 | 描述 |
| hasSpecs | boolean | 否 | 是否有规格，默认false |

**响应数据**

返回创建的选品信息，格式同Selection接口。

**请求示例**

```bash
curl -X POST http://api.example.com/api/v1/selections \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -d '{
    "name": "测试选品1",
    "category": "数码",
    "price": 99.99,
    "stock": 100,
    "source": "manual",
    "coverImage": "http://example.com/images/1.jpg",
    "description": "这是一个测试选品"
  }'
```

**响应示例**

```json
{
    "code": 200,
    "data": {
        "id": 1,
        "name": "测试选品1",
        "category": "数码",
        "price": 99.99,
        "stock": 100,
        "status": "pending",
        "source": "manual",
        "coverImage": "http://example.com/images/1.jpg",
        "description": "这是一个测试选品",
        "hasSpecs": false,
        "createdAt": "2025-01-01T08:00:00Z",
        "updatedAt": "2025-01-01T08:00:00Z"
    },
    "message": "创建成功",
    "timestamp": 1704067200000
}
```

### 更新选品

更新选品信息。

**请求URL**

```http
PUT /selections/:id
```

**路径参数**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | number | 是 | 选品ID |

**请求参数**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| name | string | 否 | 选品名称 |
| category | string | 否 | 分类 |
| price | number | 否 | 价格 |
| stock | number | 否 | 库存 |
| status | string | 否 | 状态 |
| sourceUrl | string | 否 | 来源链接 |
| coverImage | string | 否 | 主图URL |
| description | string | 否 | 描述 |
| hasSpecs | boolean | 否 | 是否有规格 |

**响应数据**

返回更新后的选品信息，格式同Selection接口。

**请求示例**

```bash
curl -X PUT http://api.example.com/api/v1/selections/1 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -d '{
    "price": 88.88,
    "stock": 200,
    "description": "更新后的描述"
  }'
```

**响应示例**

```json
{
    "code": 200,
    "data": {
        "id": 1,
        "name": "测试选品1",
        "category": "数码",
        "price": 88.88,
        "stock": 200,
        "status": "pending",
        "source": "manual",
        "coverImage": "http://example.com/images/1.jpg",
        "description": "更新后的描述",
        "hasSpecs": false,
        "createdAt": "2025-01-01T08:00:00Z",
        "updatedAt": "2025-01-01T08:10:00Z"
    },
    "message": "更新成功",
    "timestamp": 1704067800000
}
```

### 删除选品

删除指定的选品。

**请求URL**

```http
DELETE /selections/:id
```

**路径参数**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | number | 是 | 选品ID |

**响应数据**

无

**请求示例**

```bash
curl -X DELETE http://api.example.com/api/v1/selections/1 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**响应示例**

```json
{
    "code": 200,
    "message": "删除成功",
    "timestamp": 1704067800000
}
```

## 商品管理API

### 获取商品列表

获取商品列表，支持分页、筛选和排序。

**请求URL**

```http
GET /products
```

**查询参数**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| page | number | 否 | 页码，默认1 |
| pageSize | number | 否 | 每页数量，默认10 |
| status | string | 否 | 状态筛选(draft/pending/published/failed/offline) |
| storeId | number | 否 | 店铺ID筛选 |
| category | string | 否 | 分类筛选 |
| keyword | string | 否 | 关键词搜索(搜索名称和描述) |
| sortBy | string | 否 | 排序字段(createdAt/price/stock) |
| sortOrder | string | 否 | 排序方向(asc/desc) |

**响应数据**

```typescript
interface ProductListResponse {
    items: Product[];     // 商品列表
    total: number;        // 总数量
    page: number;         // 当前页码
    pageSize: number;     // 每页数量
}

interface Product {
    id: number;           // 商品ID
    selectionId: number;  // 选品ID
    storeId: number;      // 店铺ID
    name: string;         // 名称
    category?: string;    // 分类
    price: number;        // 价格
    stock: number;        // 库存
    status: string;       // 状态
    distributedTitle?: string;   // 分发后的标题
    distributedContent?: string; // 分发后的详情
    distributedAt?: string;      // 分发时间
    publishedAt?: string;        // 发布时间
    specs?: ProductSpec[];       // 商品规格
    images?: ProductImage[];     // 商品图片
    createdAt: string;    // 创建时间
    updatedAt: string;    // 更新时间
}

interface ProductSpec {
    id: number;          // 规格ID
    name: string;        // 规格名称
    value: string;       // 规格值
    price?: number;      // 规格价格
    stock?: number;      // 规格库存
}

interface ProductImage {
    id: number;          // 图片ID
    type: string;        // 图片类型(main/detail)
    url: string;         // 图片URL
    sortOrder?: number;  // 排序顺序
}
```

**请求示例**

```bash
curl -X GET "http://api.example.com/api/v1/products?page=1&pageSize=10&status=published&storeId=1&sortBy=createdAt&sortOrder=desc" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**响应示例**

```json
{
    "code": 200,
    "data": {
        "items": [
            {
                "id": 1,
                "selectionId": 1,
                "storeId": 1,
                "name": "测试商品1",
                "category": "数码",
                "price": 99.99,
                "stock": 100,
                "status": "published",
                "distributedTitle": "【热销】测试商品1",
                "distributedContent": "商品详情...",
                "distributedAt": "2025-01-01T08:00:00Z",
                "publishedAt": "2025-01-01T09:00:00Z",
                "specs": [
                    {
                        "id": 1,
                        "name": "颜色",
                        "value": "红色",
                        "price": 99.99,
                        "stock": 50
                    },
                    {
                        "id": 2,
                        "name": "颜色",
                        "value": "蓝色",
                        "price": 99.99,
                        "stock": 50
                    }
                ],
                "images": [
                    {
                        "id": 1,
                        "type": "main",
                        "url": "http://example.com/images/1.jpg",
                        "sortOrder": 1
                    },
                    {
                        "id": 2,
                        "type": "detail",
                        "url": "http://example.com/images/2.jpg",
                        "sortOrder": 2
                    }
                ],
                "createdAt": "2025-01-01T08:00:00Z",
                "updatedAt": "2025-01-01T09:00:00Z"
            }
        ],
        "total": 1,
        "page": 1,
        "pageSize": 10
    },
    "timestamp": 1704067200000
}
```

### 创建商品

创建新的商品。

**请求URL**

```http
POST /products
```

**请求参数**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| selectionId | number | 是 | 选品ID |
| name | string | 是 | 商品名称 |
| category | string | 否 | 分类 |
| price | number | 是 | 价格 |
| stock | number | 是 | 库存 |
| specs | ProductSpec[] | 否 | 商品规格 |
| images | ProductImage[] | 否 | 商品图片 |

**响应数据**

返回创建的商品信息，格式同Product接口。

**请求示例**

```bash
curl -X POST http://api.example.com/api/v1/products \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -d '{
    "selectionId": 1,
    "name": "测试商品1",
    "category": "数码",
    "price": 99.99,
    "stock": 100,
    "specs": [
        {
            "name": "颜色",
            "value": "红色",
            "price": 99.99,
            "stock": 50
        },
        {
            "name": "颜色",
            "value": "蓝色",
            "price": 99.99,
            "stock": 50
        }
    ],
    "images": [
        {
            "type": "main",
            "url": "http://example.com/images/1.jpg",
            "sortOrder": 1
        },
        {
            "type": "detail",
            "url": "http://example.com/images/2.jpg",
            "sortOrder": 2
        }
    ]
  }'
```

**响应示例**

```json
{
    "code": 200,
    "data": {
        "id": 1,
        "selectionId": 1,
        "name": "测试商品1",
        "category": "数码",
        "price": 99.99,
        "stock": 100,
        "status": "draft",
        "specs": [
            {
                "id": 1,
                "name": "颜色",
                "value": "红色",
                "price": 99.99,
                "stock": 50
            },
            {
                "id": 2,
                "name": "颜色",
                "value": "蓝色",
                "price": 99.99,
                "stock": 50
            }
        ],
        "images": [
            {
                "id": 1,
                "type": "main",
                "url": "http://example.com/images/1.jpg",
                "sortOrder": 1
            },
            {
                "id": 2,
                "type": "detail",
                "url": "http://example.com/images/2.jpg",
                "sortOrder": 2
            }
        ],
        "createdAt": "2025-01-01T08:00:00Z",
        "updatedAt": "2025-01-01T08:00:00Z"
    },
    "message": "创建成功",
    "timestamp": 1704067200000
}
```

### 更新商品

更新商品信息。

**请求URL**

```http
PUT /products/:id
```

**路径参数**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | number | 是 | 商品ID |

**请求参数**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| name | string | 否 | 商品名称 |
| category | string | 否 | 分类 |
| price | number | 否 | 价格 |
| stock | number | 否 | 库存 |
| status | string | 否 | 状态 |
| specs | ProductSpec[] | 否 | 商品规格 |
| images | ProductImage[] | 否 | 商品图片 |

**响应数据**

返回更新后的商品信息，格式同Product接口。

**请求示例**

```bash
curl -X PUT http://api.example.com/api/v1/products/1 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -d '{
    "price": 88.88,
    "stock": 200,
    "specs": [
        {
            "id": 1,
            "stock": 100
        },
        {
            "id": 2,
            "stock": 100
        }
    ]
  }'
```

**响应示例**

```json
{
    "code": 200,
    "data": {
        "id": 1,
        "selectionId": 1,
        "name": "测试商品1",
        "category": "数码",
        "price": 88.88,
        "stock": 200,
        "status": "draft",
        "specs": [
            {
                "id": 1,
                "name": "颜色",
                "value": "红色",
                "price": 99.99,
                "stock": 100
            },
            {
                "id": 2,
                "name": "颜色",
                "value": "蓝色",
                "price": 99.99,
                "stock": 100
            }
        ],
        "images": [
            {
                "id": 1,
                "type": "main",
                "url": "http://example.com/images/1.jpg",
                "sortOrder": 1
            },
            {
                "id": 2,
                "type": "detail",
                "url": "http://example.com/images/2.jpg",
                "sortOrder": 2
            }
        ],
        "createdAt": "2025-01-01T08:00:00Z",
        "updatedAt": "2025-01-01T08:10:00Z"
    },
    "message": "更新成功",
    "timestamp": 1704067800000
}
```

### 删除商品

删除指定的商品。

**请求URL**

```http
DELETE /products/:id
```

**路径参数**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | number | 是 | 商品ID |

**响应数据**

无

**请求示例**

```bash
curl -X DELETE http://api.example.com/api/v1/products/1 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**响应示例**

```json
{
    "code": 200,
    "message": "删除成功",
    "timestamp": 1704067800000
}
```

### 发布商品

将商品发布到指定店铺。

**请求URL**

```http
POST /products/:id/publish
```

**路径参数**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | number | 是 | 商品ID |

**请求参数**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| storeIds | number[] | 是 | 店铺ID列表 |
| scheduledAt | string | 否 | 定时发布时间(ISO8601格式) |

**响应数据**

```typescript
interface PublishResponse {
    taskId: string;      // 发布任务ID
    status: string;      // 任务状态
}
```

**请求示例**

```bash
curl -X POST http://api.example.com/api/v1/products/1/publish \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -d '{
    "storeIds": [1, 2],
    "scheduledAt": "2025-01-02T00:00:00Z"
  }'
```

**响应示例**

```json
{
    "code": 200,
    "data": {
        "taskId": "task_123456",
        "status": "scheduled"
    },
    "message": "发布任务已创建",
    "timestamp": 1704067800000
}
```

## 店铺管理API

### 获取店铺列表

获取店铺列表，支持分页和筛选。

**请求URL**

```http
GET /stores
```

**查询参数**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| page | number | 否 | 页码，默认1 |
| pageSize | number | 否 | 每页数量，默认10 |
| platform | string | 否 | 平台筛选 |
| status | string | 否 | 状态筛选(active/inactive) |
| groupId | number | 否 | 店铺分组ID |

**响应数据**

```typescript
interface StoreListResponse {
    items: Store[];      // 店铺列表
    total: number;       // 总数量
    page: number;        // 当前页码
    pageSize: number;    // 每页数量
}

interface Store {
    id: number;          // 店铺ID
    name: string;        // 店铺名称
    platform: string;    // 平台
    status: string;      // 状态
    config: StoreConfig; // 店铺配置
    groups?: StoreGroup[]; // 店铺分组
    createdAt: string;   // 创建时间
    updatedAt: string;   // 更新时间
}

interface StoreConfig {
    apiKey?: string;     // API密钥
    apiSecret?: string;  // API密钥
    shopId?: string;     // 店铺ID
    warehouse?: string;  // 仓库编码
    // 其他平台特定配置...
}

interface StoreGroup {
    id: number;         // 分组ID
    name: string;       // 分组名称
}
```

**请求示例**

```bash
curl -X GET "http://api.example.com/api/v1/stores?page=1&pageSize=10&platform=shopee&status=active" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**响应示例**

```json
{
    "code": 200,
    "data": {
        "items": [
            {
                "id": 1,
                "name": "测试店铺1",
                "platform": "shopee",
                "status": "active",
                "config": {
                    "apiKey": "test_api_key",
                    "shopId": "123456",
                    "warehouse": "SG"
                },
                "groups": [
                    {
                        "id": 1,
                        "name": "东南亚店铺"
                    }
                ],
                "createdAt": "2025-01-01T08:00:00Z",
                "updatedAt": "2025-01-01T08:00:00Z"
            }
        ],
        "total": 1,
        "page": 1,
        "pageSize": 10
    },
    "timestamp": 1704067200000
}
```

### 创建店铺

创建新的店铺。

**请求URL**

```http
POST /stores
```

**请求参数**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| name | string | 是 | 店铺名称 |
| platform | string | 是 | 平台 |
| config | StoreConfig | 是 | 店铺配置 |
| groupIds | number[] | 否 | 店铺分组ID列表 |

**响应数据**

返回创建的店铺信息，格式同Store接口。

**请求示例**

```bash
curl -X POST http://api.example.com/api/v1/stores \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -d '{
    "name": "测试店铺1",
    "platform": "shopee",
    "config": {
        "apiKey": "test_api_key",
        "shopId": "123456",
        "warehouse": "SG"
    },
    "groupIds": [1]
  }'
```

**响应示例**

```json
{
    "code": 200,
    "data": {
        "id": 1,
        "name": "测试店铺1",
        "platform": "shopee",
        "status": "active",
        "config": {
            "apiKey": "test_api_key",
            "shopId": "123456",
            "warehouse": "SG"
        },
        "groups": [
            {
                "id": 1,
                "name": "东南亚店铺"
            }
        ],
        "createdAt": "2025-01-01T08:00:00Z",
        "updatedAt": "2025-01-01T08:00:00Z"
    },
    "message": "创建成功",
    "timestamp": 1704067200000
}
```

### 更新店铺

更新店铺信息。

**请求URL**

```http
PUT /stores/:id
```

**路径参数**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | number | 是 | 店铺ID |

**请求参数**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| name | string | 否 | 店铺名称 |
| status | string | 否 | 状态 |
| config | StoreConfig | 否 | 店铺配置 |
| groupIds | number[] | 否 | 店铺分组ID列表 |

**响应数据**

返回更新后的店铺信息，格式同Store接口。

**请求示例**

```bash
curl -X PUT http://api.example.com/api/v1/stores/1 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -d '{
    "name": "测试店铺1(新)",
    "config": {
        "warehouse": "MY"
    },
    "groupIds": [1, 2]
  }'
```

**响应示例**

```json
{
    "code": 200,
    "data": {
        "id": 1,
        "name": "测试店铺1(新)",
        "platform": "shopee",
        "status": "active",
        "config": {
            "apiKey": "test_api_key",
            "shopId": "123456",
            "warehouse": "MY"
        },
        "groups": [
            {
                "id": 1,
                "name": "东南亚店铺"
            },
            {
                "id": 2,
                "name": "马来西亚店铺"
            }
        ],
        "createdAt": "2025-01-01T08:00:00Z",
        "updatedAt": "2025-01-01T08:10:00Z"
    },
    "message": "更新成功",
    "timestamp": 1704067800000
}
```

### 删除店铺

删除指定的店铺。

**请求URL**

```http
DELETE /stores/:id
```

**路径参数**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | number | 是 | 店铺ID |

**响应数据**

无

**请求示例**

```bash
curl -X DELETE http://api.example.com/api/v1/stores/1 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**响应示例**

```json
{
    "code": 200,
    "message": "删除成功",
    "timestamp": 1704067800000
}
```

### 获取店铺分组列表

获取所有店铺分组。

**请求URL**

```http
GET /store-groups
```

**响应数据**

```typescript
interface StoreGroupListResponse {
    items: StoreGroup[];  // 分组列表
}
```

**请求示例**

```bash
curl -X GET http://api.example.com/api/v1/store-groups \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**响应示例**

```json
{
    "code": 200,
    "data": {
        "items": [
            {
                "id": 1,
                "name": "东南亚店铺"
            },
            {
                "id": 2,
                "name": "马来西亚店铺"
            }
        ]
    },
    "timestamp": 1704067200000
}
```

## 模板管理API

### 获取模板列表

获取模板列表，支持分页和筛选。

**请求URL**

```http
GET /templates
```

**查询参数**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| page | number | 否 | 页码，默认1 |
| pageSize | number | 否 | 每页数量，默认10 |
| keyword | string | 否 | 关键词搜索(搜索名称和内容) |
| createdBy | number | 否 | 创建者ID筛选 |

**响应数据**

```typescript
interface TemplateListResponse {
    items: Template[];    // 模板列表
    total: number;        // 总数量
    page: number;         // 当前页码
    pageSize: number;     // 每页数量
}

interface Template {
    id: number;           // 模板ID
    name: string;         // 模板名称
    content: string;      // 模板内容
    variables: TemplateVariable[]; // 模板变量
    createdBy: number;    // 创建者ID
    createdAt: string;    // 创建时间
    updatedAt: string;    // 更新时间
}

interface TemplateVariable {
    name: string;         // 变量名称
    type: string;         // 变量类型(string/number/boolean)
    defaultValue?: string;// 默认值
    required: boolean;    // 是否必填
    description?: string; // 变量描述
}
```

**请求示例**

```bash
curl -X GET "http://api.example.com/api/v1/templates?page=1&pageSize=10&keyword=测试" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**响应示例**

```json
{
    "code": 200,
    "data": {
        "items": [
            {
                "id": 1,
                "name": "测试模板1",
                "content": "这是一个{{title}}的商品，价格为{{price}}元",
                "variables": [
                    {
                        "name": "title",
                        "type": "string",
                        "required": true,
                        "description": "商品标题"
                    },
                    {
                        "name": "price",
                        "type": "number",
                        "required": true,
                        "description": "商品价格"
                    }
                ],
                "createdBy": 1,
                "createdAt": "2025-01-01T08:00:00Z",
                "updatedAt": "2025-01-01T08:00:00Z"
            }
        ],
        "total": 1,
        "page": 1,
        "pageSize": 10
    },
    "timestamp": 1704067200000
}
```

### 创建模板

创建新的模板。

**请求URL**

```http
POST /templates
```

**请求参数**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| name | string | 是 | 模板名称 |
| content | string | 是 | 模板内容 |
| variables | TemplateVariable[] | 否 | 模板变量定义 |

**响应数据**

返回创建的模板信息，格式同Template接口。

**请求示例**

```bash
curl -X POST http://api.example.com/api/v1/templates \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -d '{
    "name": "测试模板1",
    "content": "这是一个{{title}}的商品，价格为{{price}}元",
    "variables": [
        {
            "name": "title",
            "type": "string",
            "required": true,
            "description": "商品标题"
        },
        {
            "name": "price",
            "type": "number",
            "required": true,
            "description": "商品价格"
        }
    ]
  }'
```

**响应示例**

```json
{
    "code": 200,
    "data": {
        "id": 1,
        "name": "测试模板1",
        "content": "这是一个{{title}}的商品，价格为{{price}}元",
        "variables": [
            {
                "name": "title",
                "type": "string",
                "required": true,
                "description": "商品标题"
            },
            {
                "name": "price",
                "type": "number",
                "required": true,
                "description": "商品价格"
            }
        ],
        "createdBy": 1,
        "createdAt": "2025-01-01T08:00:00Z",
        "updatedAt": "2025-01-01T08:00:00Z"
    },
    "message": "创建成功",
    "timestamp": 1704067200000
}
```

### 更新模板

更新模板信息。

**请求URL**

```http
PUT /templates/:id
```

**路径参数**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | number | 是 | 模板ID |

**请求参数**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| name | string | 否 | 模板名称 |
| content | string | 否 | 模板内容 |
| variables | TemplateVariable[] | 否 | 模板变量定义 |

**响应数据**

返回更新后的模板信息，格式同Template接口。

**请求示例**

```bash
curl -X PUT http://api.example.com/api/v1/templates/1 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -d '{
    "name": "测试模板1(新)",
    "content": "这是一个{{title}}的商品，原价{{originalPrice}}元，现价{{price}}元",
    "variables": [
        {
            "name": "title",
            "type": "string",
            "required": true,
            "description": "商品标题"
        },
        {
            "name": "originalPrice",
            "type": "number",
            "required": true,
            "description": "原价"
        },
        {
            "name": "price",
            "type": "number",
            "required": true,
            "description": "现价"
        }
    ]
  }'
```

**响应示例**

```json
{
    "code": 200,
    "data": {
        "id": 1,
        "name": "测试模板1(新)",
        "content": "这是一个{{title}}的商品，原价{{originalPrice}}元，现价{{price}}元",
        "variables": [
            {
                "name": "title",
                "type": "string",
                "required": true,
                "description": "商品标题"
            },
            {
                "name": "originalPrice",
                "type": "number",
                "required": true,
                "description": "原价"
            },
            {
                "name": "price",
                "type": "number",
                "required": true,
                "description": "现价"
            }
        ],
        "createdBy": 1,
        "createdAt": "2025-01-01T08:00:00Z",
        "updatedAt": "2025-01-01T08:10:00Z"
    },
    "message": "更新成功",
    "timestamp": 1704067800000
}
```

### 删除模板

删除指定的模板。

**请求URL**

```http
DELETE /templates/:id
```

**路径参数**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | number | 是 | 模板ID |

**响应数据**

无

**请求示例**

```bash
curl -X DELETE http://api.example.com/api/v1/templates/1 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**响应示例**

```json
{
    "code": 200,
    "message": "删除成功",
    "timestamp": 1704067800000
}
```

### 应用模板

将模板应用到商品。

**请求URL**

```http
POST /templates/:id/apply
```

**路径参数**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | number | 是 | 模板ID |

**请求参数**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| productId | number | 是 | 商品ID |
| variables | Record<string, string> | 是 | 变量值映射 |

**响应数据**

```typescript
interface ApplyTemplateResponse {
    title: string;       // 渲染后的标题
    content: string;     // 渲染后的内容
}
```

**请求示例**

```bash
curl -X POST http://api.example.com/api/v1/templates/1/apply \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -d '{
    "productId": 1,
    "variables": {
        "title": "iPhone 15",
        "originalPrice": "9999",
        "price": "8888"
    }
  }'
```

**响应示例**

```json
{
    "code": 200,
    "data": {
        "title": "iPhone 15",
        "content": "这是一个iPhone 15的商品，原价9999元，现价8888元"
    },
    "message": "应用成功",
    "timestamp": 1704067800000
}
```

## 文件上传API

### 单文件上传

上传单个文件。

**请求URL**

```http
POST /files/upload
```

**请求参数**

使用 `multipart/form-data` 格式

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| file | File | 是 | 要上传的文件 |
| type | string | 否 | 文件类型(product/avatar等)，默认other |

**限制说明**
- 支持的文件类型：jpg、jpeg、png、gif、webp
- 单个文件大小限制：10MB
- 文件名长度限制：100字符

**响应数据**

```typescript
interface FileResponse {
    id: number;          // 文件ID
    filename: string;    // 文件名
    originalName: string;// 原始文件名
    type: string;        // 文件类型
    size: number;        // 文件大小(字节)
    mimeType: string;    // MIME类型
    url: string;         // 访问URL
    createdAt: string;   // 创建时间
}
```

**请求示例**

```bash
curl -X POST http://api.example.com/api/v1/files/upload \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -F "file=@/path/to/image.jpg" \
  -F "type=product"
```

**响应示例**

```json
{
    "code": 200,
    "data": {
        "id": 1,
        "filename": "202501010800_product_1.jpg",
        "originalName": "image.jpg",
        "type": "product",
        "size": 1024000,
        "mimeType": "image/jpeg",
        "url": "http://example.com/uploads/202501010800_product_1.jpg",
        "createdAt": "2025-01-01T08:00:00Z"
    },
    "message": "上传成功",
    "timestamp": 1704067200000
}
```

### 多文件上传

同时上传多个文件。

**请求URL**

```http
POST /files/batch-upload
```

**请求参数**

使用 `multipart/form-data` 格式

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| files | File[] | 是 | 要上传的文件列表 |
| type | string | 否 | 文件类型(product/avatar等)，默认other |

**限制说明**
- 支持的文件类型：jpg、jpeg、png、gif、webp
- 单个文件大小限制：10MB
- 单次上传文件数量限制：10个
- 文件名长度限制：100字符

**响应数据**

返回文件信息数组，单个文件格式同FileResponse接口。

**请求示例**

```bash
curl -X POST http://api.example.com/api/v1/files/batch-upload \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -F "files[]=@/path/to/image1.jpg" \
  -F "files[]=@/path/to/image2.jpg" \
  -F "type=product"
```

**响应示例**

```json
{
    "code": 200,
    "data": [
        {
            "id": 1,
            "filename": "202501010800_product_1.jpg",
            "originalName": "image1.jpg",
            "type": "product",
            "size": 1024000,
            "mimeType": "image/jpeg",
            "url": "http://example.com/uploads/202501010800_product_1.jpg",
            "createdAt": "2025-01-01T08:00:00Z"
        },
        {
            "id": 2,
            "filename": "202501010800_product_2.jpg",
            "originalName": "image2.jpg",
            "type": "product",
            "size": 1024000,
            "mimeType": "image/jpeg",
            "url": "http://example.com/uploads/202501010800_product_2.jpg",
            "createdAt": "2025-01-01T08:00:00Z"
        }
    ],
    "message": "上传成功",
    "timestamp": 1704067200000
}
```

### 获取文件列表

获取已上传的文件列表，支持分页和筛选。

**请求URL**

```http
GET /files
```

**查询参数**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| page | number | 否 | 页码，默认1 |
| pageSize | number | 否 | 每页数量，默认10 |
| type | string | 否 | 文件类型筛选 |
| startDate | string | 否 | 开始日期(YYYY-MM-DD) |
| endDate | string | 否 | 结束日期(YYYY-MM-DD) |

**响应数据**

```typescript
interface FileListResponse {
    items: FileResponse[]; // 文件列表
    total: number;        // 总数量
    page: number;         // 当前页码
    pageSize: number;     // 每页数量
}
```

**请求示例**

```bash
curl -X GET "http://api.example.com/api/v1/files?page=1&pageSize=10&type=product" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**响应示例**

```json
{
    "code": 200,
    "data": {
        "items": [
            {
                "id": 1,
                "filename": "202501010800_product_1.jpg",
                "originalName": "image1.jpg",
                "type": "product",
                "size": 1024000,
                "mimeType": "image/jpeg",
                "url": "http://example.com/uploads/202501010800_product_1.jpg",
                "createdAt": "2025-01-01T08:00:00Z"
            }
        ],
        "total": 1,
        "page": 1,
        "pageSize": 10
    },
    "timestamp": 1704067200000
}
```

### 删除文件

删除指定的文件。

**请求URL**

```http
DELETE /files/:id
```

**路径参数**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | number | 是 | 文件ID |

**响应数据**

无

**请求示例**

```bash
curl -X DELETE http://api.example.com/api/v1/files/1 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**响应示例**

```json
{
    "code": 200,
    "message": "删除成功",
    "timestamp": 1704067800000
}
```

