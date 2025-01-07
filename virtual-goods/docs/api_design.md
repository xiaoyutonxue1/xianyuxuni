# 虚拟商品管理系统API设计文档

## 目录
- [概述](#概述)
- [通用说明](#通用说明)
- [认证相关API](#认证相关api)
- [选品管理API](#选品管理api)
- [商品管理API](#商品管理api)
- [店铺管理API](#店铺管理api)
- [模板管理API](#模板管理api)
- [文件上传API](#文件上传api)

## 概述

本文档详细描述虚拟商品管理系统的API接口设计。所有API均遵循RESTful设计规范，使用JSON格式进行数据交换。

### 基础URL

```
https://api.example.com/v1
```

### 通用说明

#### 请求头

```
Content-Type: application/json
Authorization: Bearer <token>
```

#### 响应格式

```typescript
interface ApiResponse<T> {
    code: number;          // 状态码
    data?: T;             // 响应数据
    message?: string;     // 提示信息
    timestamp: number;    // 时间戳
}

interface PaginatedResponse<T> {
    items: T[];           // 数据列表
    total: number;        // 总数量
    page: number;         // 当前页
    pageSize: number;     // 每页数量
}
```

#### 通用错误码

```
400 Bad Request         - 请求参数错误
401 Unauthorized        - 未登录或token失效
403 Forbidden          - 无权限
404 Not Found          - 资源不存在
500 Internal Error     - 服务器内部错误
```

## 认证相关API

### 登录

```typescript
POST /auth/login

Request:
{
    username: string;
    password: string;
}

Response:
{
    code: number;
    data: {
        token: string;
        user: {
            id: number;
            username: string;
            role: string;
        }
    }
}
```

### 登出

```typescript
POST /auth/logout

Response:
{
    code: number;
    message: string;
}
```

### 刷新Token

```typescript
POST /auth/refresh-token

Request:
{
    refreshToken: string;
}

Response:
{
    code: number;
    data: {
        token: string;
        refreshToken: string;
    }
}
```

## 选品管理API

### 获取选品列表

```typescript
GET /selections

Query Parameters:
{
    page?: number;         // 页码
    pageSize?: number;     // 每页数量
    status?: string;       // 状态筛选
    category?: string;     // 分类筛选
    keyword?: string;      // 关键词搜索
    sortBy?: string;       // 排序字段
    sortOrder?: 'asc' | 'desc'; // 排序方向
}

Response:
{
    code: number;
    data: {
        items: Selection[];
        total: number;
        page: number;
        pageSize: number;
    }
}

interface Selection {
    id: number;
    name: string;
    category: string;
    price: number;
    stock: number;
    status: string;
    source: string;
    sourceUrl?: string;
    coverImage?: string;
    description?: string;
    hasSpecs: boolean;
    createdAt: string;
    updatedAt: string;
}
```

### 创建选品

```typescript
POST /selections

Request:
{
    name: string;
    category?: string;
    price: number;
    stock: number;
    source: 'manual' | 'crawler';
    sourceUrl?: string;
    coverImage?: string;
    description?: string;
    hasSpecs: boolean;
}

Response:
{
    code: number;
    data: Selection;
}
```

### 更新选品

```typescript
PUT /selections/:id

Request:
{
    name?: string;
    category?: string;
    price?: number;
    stock?: number;
    status?: string;
    description?: string;
}

Response:
{
    code: number;
    data: Selection;
}
```

### 删除选品

```typescript
DELETE /selections/:id

Response:
{
    code: number;
    message: string;
}
```

## 商品管理API

### 获取商品列表

```typescript
GET /products

Query Parameters:
{
    page?: number;
    pageSize?: number;
    status?: string;
    storeId?: number;
    category?: string;
    keyword?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

Response:
{
    code: number;
    data: {
        items: Product[];
        total: number;
        page: number;
        pageSize: number;
    }
}

interface Product {
    id: number;
    selectionId: number;
    storeId: number;
    name: string;
    category: string;
    price: number;
    stock: number;
    status: string;
    distributedTitle?: string;
    distributedContent?: string;
    distributedAt?: string;
    publishedAt?: string;
    specs?: ProductSpec[];
    images?: ProductImage[];
    createdAt: string;
    updatedAt: string;
}
```

### 创建商品

```typescript
POST /products

Request:
{
    selectionId: number;
    name: string;
    category?: string;
    price: number;
    stock: number;
    specs?: {
        name: string;
        value: string;
        price?: number;
        stock?: number;
    }[];
    images?: {
        type: 'main' | 'detail';
        url: string;
        sortOrder?: number;
    }[];
}

Response:
{
    code: number;
    data: Product;
}
```

### 更新商品

```typescript
PUT /products/:id

Request:
{
    name?: string;
    category?: string;
    price?: number;
    stock?: number;
    status?: string;
    specs?: ProductSpec[];
    images?: ProductImage[];
}

Response:
{
    code: number;
    data: Product;
}
```

### 发布商品

```typescript
POST /products/:id/publish

Request:
{
    storeIds: number[];
    scheduledAt?: string;
}

Response:
{
    code: number;
    data: {
        taskId: string;
        status: string;
    }
}
```

## 店铺管理API

### 获取店铺列表

```typescript
GET /stores

Query Parameters:
{
    page?: number;
    pageSize?: number;
    platform?: string;
    status?: string;
    groupId?: number;
}

Response:
{
    code: number;
    data: {
        items: Store[];
        total: number;
        page: number;
        pageSize: number;
    }
}

interface Store {
    id: number;
    name: string;
    platform: string;
    status: string;
    groups?: StoreGroup[];
    createdAt: string;
}
```

### 创建店铺

```typescript
POST /stores

Request:
{
    name: string;
    platform: string;
    groupIds?: number[];
}

Response:
{
    code: number;
    data: Store;
}
```

### 更新店铺

```typescript
PUT /stores/:id

Request:
{
    name?: string;
    status?: string;
    groupIds?: number[];
}

Response:
{
    code: number;
    data: Store;
}
```

## 模板管理API

### 获取模板列表

```typescript
GET /templates

Query Parameters:
{
    page?: number;
    pageSize?: number;
}

Response:
{
    code: number;
    data: {
        items: Template[];
        total: number;
        page: number;
        pageSize: number;
    }
}

interface Template {
    id: number;
    name: string;
    content: string;
    variables: {
        name: string;
        type: string;
        defaultValue?: string;
        required: boolean;
    }[];
    createdAt: string;
    updatedAt: string;
}
```

### 创建模板

```typescript
POST /templates

Request:
{
    name: string;
    content: string;
    variables?: {
        name: string;
        type: string;
        defaultValue?: string;
        required?: boolean;
    }[];
}

Response:
{
    code: number;
    data: Template;
}
```

### 更新模板

```typescript
PUT /templates/:id

Request:
{
    name?: string;
    content?: string;
    variables?: TemplateVariable[];
}

Response:
{
    code: number;
    data: Template;
}
```

### 应用模板

```typescript
POST /templates/:id/apply

Request:
{
    productId: number;
    variables?: Record<string, string>;
}

Response:
{
    code: number;
    data: {
        title: string;
        content: string;
    }
}
```

## 文件上传API

### 上传图片

```typescript
POST /upload/image

Request:
FormData {
    file: File;
    type: 'selection' | 'product';
    productId?: number;
    imageType?: 'main' | 'detail';
}

Response:
{
    code: number;
    data: {
        url: string;
        type: string;
        size: number;
    }
}
```

### 批量上传图片

```typescript
POST /upload/images

Request:
FormData {
    files: File[];
    type: 'selection' | 'product';
    productId?: number;
    imageType?: 'main' | 'detail';
}

Response:
{
    code: number;
    data: {
        success: {
            url: string;
            type: string;
            size: number;
        }[];
        failed: {
            name: string;
            error: string;
        }[];
    }
} 