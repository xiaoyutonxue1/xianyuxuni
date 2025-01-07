# 虚拟商品管理系统部署文档

## 目录
1. [环境说明](#环境说明)
2. [本地开发环境](#本地开发环境)
3. [数据库配置](#数据库配置)
4. [生产环境部署](#生产环境部署)
5. [常见问题](#常见问题)

## 环境说明

### 技术栈
- 前端：React + TypeScript + Vite
- 后端：Node.js + Express
- 数据库：PostgreSQL
- 容器化：Docker + Docker Compose

### 系统要求
- Docker 20.10+
- Docker Compose 2.20+
- Node.js 18+（本地开发时需要）
- PostgreSQL 14+（本地开发时需要）

## 本地开发环境

### 1. 安装必要工具
```bash
# Windows用户推荐使用winget安装
winget install -e --id Docker.DockerDesktop
winget install -e --id OpenJS.NodeJS.LTS
winget install -e --id PostgreSQL.PostgreSQL

# macOS用户推荐使用brew安装
brew install --cask docker
brew install node@18
brew install postgresql@14
```

### 2. 克隆项目
```bash
git clone <项目地址>
cd virtual-goods
```

### 3. 启动开发环境
```bash
# 启动Docker开发环境
docker-compose -f docker-compose.dev.yml up -d

# 检查服务状态
docker-compose -f docker-compose.dev.yml ps
```

### 4. 开发模式说明
- 前端开发服务器：http://localhost:5173
- 后端API服务器：http://localhost:3000
- 数据库：localhost:5432

## 数据库配置

### 1. 数据库初始化
数据库初始化是自动完成的，流程如下：
1. PostgreSQL容器首次启动时会执行`/docker-entrypoint-initdb.d/`目录下的所有`.sql`文件
2. 我们的`init.sql`被挂载到该目录：`./docker/postgres/init.sql:/docker-entrypoint-initdb.d/init.sql`
3. `init.sql`会自动创建数据库和所有表

### 2. 验证数据库
```bash
# 进入PostgreSQL容器
docker exec -it vg-postgres-dev psql -U postgres

# 查看所有数据库
\l

# 连接到virtual_goods数据库
\c virtual_goods

# 查看所有表
\dt

# 查看某个表的结构
\d+ users
```

### 3. 重置数据库
如果需要重置数据库，执行以下步骤：
```bash
# 停止所有服务
docker-compose -f docker-compose.dev.yml down

# 删除数据卷
docker volume rm vg-postgres-data

# 重新启动服务
docker-compose -f docker-compose.dev.yml up -d
```

## 生产环境部署

### 1. 服务器要求
- 操作系统：Ubuntu Server 20.04+
- CPU：2核+
- 内存：4GB+
- 磁盘：40GB+

### 2. 部署步骤
1. 服务器环境准备
```bash
# 安装Docker
curl -fsSL https://get.docker.com | sh

# 安装Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

2. 上传项目文件
```bash
# 创建项目目录
mkdir -p /home/lighthouse/virtual-goods
cd /home/lighthouse/virtual-goods

# 上传项目文件（使用scp或其他工具）
```

3. 启动服务
```bash
# 构建并启动服务
docker-compose up -d --build

# 查看服务状态
docker-compose ps
```

## 常见问题

### 1. 数据库连接问题
- 问题：后端无法连接到数据库
- 解决：检查数据库连接字符串，确保使用正确的主机名（容器名）
```bash
# 正确的连接字符串格式
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/virtual_goods
```

### 2. 前端构建失败
- 问题：TypeScript编译错误
- 解决：检查`tsconfig.json`配置，确保所有依赖都已正确安装
```bash
# 重新安装依赖
npm clean-install
```

### 3. 权限问题
- 问题：数据卷权限错误
- 解决：调整目录权限
```bash
# 修改数据目录权限
sudo chown -R 1000:1000 ./postgres-data
```

### 4. 容器健康检查失败
- 问题：服务未能通过健康检查
- 解决：检查服务日志
```bash
# 查看容器日志
docker-compose logs [服务名]

# 查看特定服务的健康状态
docker inspect [容器ID] | grep Health -A 10