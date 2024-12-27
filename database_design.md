# 虚拟商品管理系统数据库设计文档

## 目录
- [概述](#概述)
- [数据库架构](#数据库架构)
- [核心表设计](#核心表设计)
- [索引设计](#索引设计)
- [性能优化](#性能优化)

## 概述

本文档详细描述虚拟商品管理系统的数据库设计方案。系统使用PostgreSQL作为主要数据库，包含核心业务表。

### 设计原则

1. 遵循数据库设计范式
2. 保证数据完整性和一致性
3. 优化查询性能
4. 支持水平扩展
5. 便于维护和升级

## 数据库架构

```sql
-- 数据库创建
CREATE DATABASE virtual_goods
    WITH 
    ENCODING = 'UTF8'
    LC_COLLATE = 'en_US.utf8'
    LC_CTYPE = 'en_US.utf8';
```

## 核心表设计

### 1. 用户管理相关表

```sql
-- 用户表
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(100),
    role VARCHAR(20) DEFAULT 'user',
    status VARCHAR(20) DEFAULT 'active',
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 角色表
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 用户角色关联表
CREATE TABLE user_roles (
    user_id INTEGER REFERENCES users(id),
    role_id INTEGER REFERENCES roles(id),
    PRIMARY KEY (user_id, role_id)
);
```

### 2. 选品管理相关表

```sql
-- 选品表
CREATE TABLE selections (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    price DECIMAL(10,2),
    stock INTEGER,
    status VARCHAR(50),        -- pending/distributed/inactive
    source VARCHAR(50),        -- manual/crawler
    source_url TEXT,          -- 商品来源链接
    cover_image TEXT,         -- 商品主图
    description TEXT,         -- 商品描述
    has_specs BOOLEAN DEFAULT false,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 选品历史记录表
CREATE TABLE selection_history (
    id SERIAL PRIMARY KEY,
    selection_id INTEGER REFERENCES selections(id),
    field_name VARCHAR(50) NOT NULL,
    old_value TEXT,
    new_value TEXT,
    changed_by INTEGER REFERENCES users(id),
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3. 商品管理相关表

```sql
-- 商品表
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    selection_id INTEGER REFERENCES selections(id),
    store_id INTEGER REFERENCES stores(id),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    price DECIMAL(10,2),
    stock INTEGER,
    status VARCHAR(50),        -- draft/pending/published/failed/offline
    distributed_title TEXT,    -- 模板渲染后的标题
    distributed_content TEXT,  -- 模板渲染后的文案
    distributed_at TIMESTAMP,
    published_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 商品规格表
CREATE TABLE product_specs (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id),
    spec_name VARCHAR(50) NOT NULL,
    spec_value VARCHAR(100) NOT NULL,
    price DECIMAL(10,2),
    stock INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 商品图片表
CREATE TABLE product_images (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id),
    image_type VARCHAR(20) NOT NULL,  -- main/detail
    image_url TEXT NOT NULL,
    sort_order INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 4. 店铺管理相关表

```sql
-- 店铺表
CREATE TABLE stores (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    platform VARCHAR(50),
    status VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 店铺分组表
CREATE TABLE store_groups (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 店铺分组映射表
CREATE TABLE store_group_mappings (
    store_id INTEGER REFERENCES stores(id),
    group_id INTEGER REFERENCES store_groups(id),
    PRIMARY KEY (store_id, group_id)
);
```

### 5. 模板管理相关表

```sql
-- 模板表
CREATE TABLE templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    content TEXT,
    variables JSONB,          -- 模板变量定义
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 模板变量表
CREATE TABLE template_variables (
    id SERIAL PRIMARY KEY,
    template_id INTEGER REFERENCES templates(id),
    variable_name VARCHAR(50) NOT NULL,
    variable_type VARCHAR(20) NOT NULL,
    default_value TEXT,
    is_required BOOLEAN DEFAULT false,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 6. 基础日志表

```sql
-- 操作日志表
CREATE TABLE operation_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    action VARCHAR(50) NOT NULL,
    target_type VARCHAR(50),
    target_id INTEGER,
    details JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 索引设计

```sql
-- 选品表索引
CREATE INDEX idx_selections_status ON selections(status);
CREATE INDEX idx_selections_category ON selections(category);
CREATE INDEX idx_selections_created_at ON selections(created_at);

-- 商品表索引
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_store_id ON products(store_id);
CREATE INDEX idx_products_selection_id ON products(selection_id);
CREATE INDEX idx_products_created_at ON products(created_at);

-- 店铺表索引
CREATE INDEX idx_stores_platform ON stores(platform);
CREATE INDEX idx_stores_status ON stores(status);

-- 日志表索引
CREATE INDEX idx_operation_logs_user_id ON operation_logs(user_id);
CREATE INDEX idx_operation_logs_created_at ON operation_logs(created_at);
CREATE INDEX idx_operation_logs_target ON operation_logs(target_type, target_id);
```

## 性能优化

### 1. 数据库参数优化

```sql
-- 内存相关参数
ALTER SYSTEM SET shared_buffers = '1GB';
ALTER SYSTEM SET work_mem = '16MB';
ALTER SYSTEM SET maintenance_work_mem = '256MB';

-- 查询优化器参数
ALTER SYSTEM SET random_page_cost = 1.1;
ALTER SYSTEM SET effective_cache_size = '3GB';

-- 写入性能参数
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
``` 