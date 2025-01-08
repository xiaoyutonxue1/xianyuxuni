-- 数据库初始化脚本

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

-- 店铺表
CREATE TABLE stores (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    platform VARCHAR(50),
    status VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 选品表
CREATE TABLE selections (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    price DECIMAL(10,2),
    stock INTEGER,
    status VARCHAR(50),
    source VARCHAR(50),
    source_url TEXT,
    cover_image TEXT,
    description TEXT,
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

-- 商品表
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    selection_id INTEGER REFERENCES selections(id),
    store_id INTEGER REFERENCES stores(id),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    price DECIMAL(10,2),
    stock INTEGER,
    status VARCHAR(50),
    distributed_title TEXT,
    distributed_content TEXT,
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
    image_type VARCHAR(20) NOT NULL,
    image_url TEXT NOT NULL,
    sort_order INTEGER,
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

-- 模板表
CREATE TABLE templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    content TEXT,
    variables JSONB,
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

-- 创建索引
CREATE INDEX idx_selections_status ON selections(status);
CREATE INDEX idx_selections_category ON selections(category);
CREATE INDEX idx_selections_created_at ON selections(created_at);

CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_store_id ON products(store_id);
CREATE INDEX idx_products_selection_id ON products(selection_id);
CREATE INDEX idx_products_created_at ON products(created_at);

CREATE INDEX idx_stores_platform ON stores(platform);
CREATE INDEX idx_stores_status ON stores(status);

CREATE INDEX idx_operation_logs_user_id ON operation_logs(user_id);
CREATE INDEX idx_operation_logs_created_at ON operation_logs(created_at);
CREATE INDEX idx_operation_logs_target ON operation_logs(target_type, target_id);
