# 虚拟商品管理系统 - 本地开发指南

## 一、项目概述

### 1.1 技术栈
- 前端：React + TypeScript + Ant Design + Vite
- 后端：Node.js + Express + TypeScript + Prisma
- 数据库：PostgreSQL
- 容器化：Docker + Docker Compose
- 开发工具：VSCode（推荐）
- 版本控制：Git

### 1.2 项目结构
```
virtual-goods/
├── frontend/           # 前端项目
│   ├── src/           # 源代码
│   ├── public/        # 静态资源
│   ├── Dockerfile     # 前端Docker配置
│   └── package.json   # 依赖配置
├── backend/           # 后端项目
│   ├── src/          # 源代码
│   ├── prisma/       # 数据库模型
│   ├── Dockerfile    # 后端Docker配置
│   └── package.json  # 依赖配置
├── docker/           # Docker配置
│   ├── postgres/     # PostgreSQL配置
│   └── nginx/        # Nginx配置
├── docs/            # 项目文档
└── docker-compose.yml # 容器编排配置
```

## 二、Docker开发环境设置

### 2.1 必要软件
1. Docker Desktop (Windows/Mac) 或 Docker Engine (Linux)
2. Docker Compose
3. Git
4. VSCode（推荐）
   - 推荐插件：
     * Docker
     * Remote - Containers
     * ESLint
     * Prettier
     * TypeScript + Webpack Problem Matchers

### 2.2 开发环境准备

1. 克隆项目
```bash
git clone [项目地址]
cd virtual-goods
```

2. 创建数据库初始化脚本

docker/postgres/init.sql:
```sql
-- 数据库创建
CREATE DATABASE virtual_goods
    WITH 
    ENCODING = 'UTF8'
    LC_COLLATE = 'en_US.utf8'
    LC_CTYPE = 'en_US.utf8';

-- 连接到新创建的数据库
\c virtual_goods

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

-- 设置数据库参数
ALTER SYSTEM SET shared_buffers = '1GB';
ALTER SYSTEM SET work_mem = '16MB';
ALTER SYSTEM SET maintenance_work_mem = '256MB';
ALTER SYSTEM SET random_page_cost = 1.1;
ALTER SYSTEM SET effective_cache_size = '3GB';
```

3. 修改docker-compose.dev.yml中的PostgreSQL配置：

```yaml
version: '3.8'

services:
  frontend:
    build: 
      context: ./frontend
      dockerfile: Dockerfile.dev
    container_name: vg-frontend-dev
    volumes:
      - ./frontend:/app
      - /app/node_modules
    ports:
      - "5173:5173"
    environment:
      - VITE_API_URL=http://localhost:3000
    depends_on:
      - backend

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.dev
    container_name: vg-backend-dev
    volumes:
      - ./backend:/app
      - /app/node_modules
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://postgres:postgres@postgres:5432/virtual_goods
    depends_on:
      postgres:
        condition: service_healthy

  postgres:
    image: postgres:14-alpine
    container_name: vg-postgres-dev
    environment:
      POSTGRES_DB: postgres
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./docker/postgres/init.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
    name: vg-postgres-data
```

4. 创建必要的目录和文件：
```bash
# 创建数据库初始化脚本目录
mkdir -p docker/postgres
# 将init.sql复制到相应目录
cp init.sql docker/postgres/
```

5. 启动开发环境：
```bash
# 删除旧的数据卷（如果需要重新初始化数据库）
docker volume rm vg-postgres-data

# 构建并启动所有服务
docker-compose -f docker-compose.dev.yml up -d

# 查看数据库初始化日志
docker-compose -f docker-compose.dev.yml logs -f postgres
```

6. 验证数据库：
```bash
# 进入数据库容器
docker exec -it vg-postgres-dev psql -U postgres -d virtual_goods

# 查看表结构
\dt

# 检查索引
\di
```

3. 创建开发环境配置文件

frontend/Dockerfile.dev:
```dockerfile
FROM node:18-alpine

WORKDIR /app

# 设置npm镜像
RUN npm config set registry https://registry.npmmirror.com

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev"]
```

backend/Dockerfile.dev:
```dockerfile
FROM node:18-alpine

WORKDIR /app

# 安装开发依赖
RUN apk add --no-cache python3 make g++ postgresql-client

# 设置npm镜像
RUN npm config set registry https://registry.npmmirror.com

COPY package*.json ./
RUN npm install

COPY . .

# 生成Prisma客户端
RUN npx prisma generate

EXPOSE 3000

CMD ["npm", "run", "dev"]
```

docker-compose.dev.yml:
```yaml
version: '3.8'

services:
  frontend:
    build: 
      context: ./frontend
      dockerfile: Dockerfile.dev
    container_name: vg-frontend-dev
    volumes:
      - ./frontend:/app
      - /app/node_modules
    ports:
      - "5173:5173"
    environment:
      - VITE_API_URL=http://localhost:3000
    depends_on:
      - backend

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.dev
    container_name: vg-backend-dev
    volumes:
      - ./backend:/app
      - /app/node_modules
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://postgres:postgres@postgres:5432/virtual_goods
    depends_on:
      - postgres

  postgres:
    image: postgres:14-alpine
    container_name: vg-postgres-dev
    environment:
      POSTGRES_DB: virtual_goods
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

3. 启动开发环境
```bash
# 构建并启动所有服务
docker-compose -f docker-compose.dev.yml up -d

# 查看服务状态
docker-compose -f docker-compose.dev.yml ps

# 查看日志
docker-compose -f docker-compose.dev.yml logs -f
```

4. 初始化数据库
```bash
# 进入后端容器
docker exec -it vg-backend-dev sh

# 运行数据库迁移
npx prisma migrate dev
```

### 2.3 开发工具配置

1. VSCode Docker 集成
- 安装 Docker 插件
- 在左侧栏可以直接管理容器
- 右键容器可以查看日志、进入终端等

2. 配置 Remote - Containers
- 可以直接在容器内开发
- 支持智能提示和调试
- 插件和设置同步到容器

## 三、Docker开发工作流程

### 3.1 日常开发

1. 启动开发环境
```bash
docker-compose -f docker-compose.dev.yml up -d
```

2. 前端开发
- 访问 http://localhost:5173
- 代码修改会自动热重载
- 容器内外文件实时同步

3. 后端开发
- 访问 http://localhost:3000
- 支持TypeScript自动编译
- 修改代码自动重启服务

4. 数据库操作
```bash
# 进入数据库容器
docker exec -it vg-postgres-dev psql -U postgres -d virtual_goods

# 执行数据库迁移
docker exec -it vg-backend-dev npx prisma migrate dev
```

### 3.2 依赖管理

1. 添加新的依赖
```bash
# 前端添加依赖
docker exec -it vg-frontend-dev npm install [package-name]

# 后端添加依赖
docker exec -it vg-backend-dev npm install [package-name]
```

2. 更新依赖
```bash
# 更新前端依赖
docker exec -it vg-frontend-dev npm update

# 更新后端依赖
docker exec -it vg-backend-dev npm update
```

### 3.3 调试技巧

1. 查看容器日志
```bash
# 查看所有容器日志
docker-compose -f docker-compose.dev.yml logs -f

# 查看特定服务日志
docker-compose -f docker-compose.dev.yml logs -f frontend
```

2. 进入容器终端
```bash
# 进入前端容器
docker exec -it vg-frontend-dev sh

# 进入后端容器
docker exec -it vg-backend-dev sh
```

3. 容器内调试
- 使用VSCode的Remote - Containers插件
- 可以直接在容器内运行调试器
- 支持断点和变量查看

## 四、生产环境部署

### 4.1 构建生产镜像

1. 构建前端
```bash
docker build -f frontend/Dockerfile -t virtual-goods-frontend:prod .
```

2. 构建后端
```bash
docker build -f backend/Dockerfile -t virtual-goods-backend:prod .
```

### 4.2 部署到服务器

1. 推送镜像到服务器
```bash
# 标记镜像
docker tag virtual-goods-frontend:prod [registry]/virtual-goods-frontend:prod
docker tag virtual-goods-backend:prod [registry]/virtual-goods-backend:prod

# 推送镜像
docker push [registry]/virtual-goods-frontend:prod
docker push [registry]/virtual-goods-backend:prod
```

2. 在服务器上部署
```bash
# 拉取最新镜像
docker-compose pull

# 启动服务
docker-compose up -d
```

## 五、常见问题解决

### 5.1 容器问题
1. 容器无法启动
   - 检查端口占用：`docker ps -a`
   - 查看错误日志：`docker logs [container-name]`
   - 检查配置文件是否正确

2. 文件同步问题
   - 检查volume配置
   - 重新构建容器：`docker-compose build`
   - 清理Docker缓存

3. 数据库连接问题
   - 确认容器网络正常
   - 检查环境变量配置
   - 验证数据库用户名密码

### 5.2 开发问题
1. 热重载不生效
   - 检查volume挂载
   - 重启开发容器
   - 检查webpack/vite配置

2. 依赖安装失败
   - 使用镜像源
   - 清理npm缓存
   - 重新构建容器

## 六、更新记录

### 2024-01-05
1. 添加Docker开发环境配置
2. 完善开发流程文档
3. 更新部署说明
4. 添加常见问题解决方案 