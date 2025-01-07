# 虚拟商品管理系统部署文档

## 1. 系统架构

### 1.1 技术栈概述
- 前端：React + TypeScript + Ant Design
- 后端：Node.js + Express + TypeScript
- 数据库：PostgreSQL
- 部署平台：1Panel
- 运行环境：Linux

### 1.2 系统架构图
```
[用户] --> [Nginx反向代理] 
           |
           |--> [前端服务(Node.js)] --> [后端API服务]
           |                             |
           |                             v
           |                         [PostgreSQL]
           |--> [PGAdmin4]
```

### 1.3 部署架构说明
- 采用前后端分离架构
- 使用Nginx作为反向代理服务器
- 数据库采用容器化部署
- 使用Docker管理服务
- 实现高可用性和可扩展性

## 2. 环境准备

### 2.1 系统要求
- 操作系统：CentOS 7+ / Ubuntu 18.04+
- CPU：2核+
- 内存：4GB+
- 磁盘：50GB+
- 网络：公网IP，80/443端口开放

### 2.2 软件要求
- 1Panel最新版本
- Docker 20.10+
- Node.js 18+
- PostgreSQL 14+
- Nginx 1.20+

### 2.3 域名和证书
- 需要已备案的域名
- SSL证书（可通过1Panel自动申请）

## 3. 数��库部署

### 3.1 PostgreSQL安装
```bash
# 通过1Panel应用商店安装PostgreSQL
1. 选择PostgreSQL 14版本
2. 设置端口（默认5432）
3. 设置root密码
4. 配置数据存储路径
```

### 3.2 数据库配置
```sql
-- 创建数据库和用户
CREATE DATABASE virtual_goods;
CREATE USER app_user WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE virtual_goods TO app_user;

-- 设置数据库参数
ALTER SYSTEM SET max_connections = '200';
ALTER SYSTEM SET shared_buffers = '1GB';
```

### 3.3 数据库备份策略
```bash
# 配置自动备份
1. 备份周期：每日凌晨3点
2. 保留时间：30天
3. 备份路径：/opt/1panel/backup/database/postgresql
```

## 4. 后端服务部署

### 4.1 代码部署
```bash
# 克隆代码
git clone [repository_url]
cd backend

# 安装依赖
npm install

# 编译TypeScript
npm run build
```

### 4.2 环境配置
```bash
# 创建环境配置文件
cat > .env << EOF
NODE_ENV=production
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=virtual_goods
DB_USER=app_user
DB_PASSWORD=your_password
JWT_SECRET=your_jwt_secret
EOF
```

### 4.3 服务启动
```bash
# 使用PM2管理进程
pm2 start dist/main.js --name virtual-goods-api
pm2 save
pm2 startup
```

## 5. 前端部署

### 5.1 构建
```bash
# 进入前端��录
cd frontend

# 安装依赖
npm install

# 构建生产环境代码
npm run build:prod
```

### 5.2 Nginx配置
```nginx
server {
    listen 80;
    server_name your_domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your_domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # SSL配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;

    # 前端文件
    location / {
        root /var/www/virtual-goods/dist;
        try_files $uri $uri/ /index.html;
        expires 7d;
    }

    # API代理
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 6. 安全配置

### 6.1 防火墙设置
```bash
# 仅开放必要端口
- 80 (HTTP)
- 443 (HTTPS)
- 22 (SSH)
```

### 6.2 数据库安全
```bash
# PostgreSQL访问控制
1. 限制数据库访问IP
2. 使用强密码策略
3. 定期更新密码
```

### 6.3 应用安全
```bash
# 安全headers配置
- 启用HSTS
- 配置CSP
- 启用XSS保护
```

## 7. 监控和维护

### 7.1 日志管理
```bash
# 日志收集
1. Nginx访问日志: /var/log/nginx/access.log
2. 应用日志: /var/log/virtual-goods/
3. 数据库日志: /opt/1panel/apps/postgresql/data/log/

# 日志轮转
logrotate配置:
- 按天切割
- 保留30天
- 启用压缩
```

### 7.2 监控配置
```bash
# 系统监控
- CPU使用率告警阈值: 80%
- 内存使用率告警阈值: 85%
- 磁盘使用率告警阈值: 85%

# 应用监控
- API响应时间 > 2s告警
- 错误率 > 1%告警
- 并发连接数监控
```

### 7.3 备份策略
```bash
# 数据备份
1. 数据库每日全量备份
2. 代码每次发布前备份
3. 配置文件定期备份

# 备份保留策略
- 每日备份保留30天
- 每周备份保留3个月
- 每月备份保留1年
```

## 8. 故障恢复

### 8.1 数据库故障
```bash
# 故障恢复步骤
1. 检查数据库日志
2. 尝试重启服务
3. 必要时回滚到最近的备份
```

### 8.2 应用故障
```bash
# 故障处理流程
1. 检查应用日志
2. 回滚到上一个稳定版本
3. 恢复数据（如需要）
```

### 8.3 网络故障
```bash
# 故障排查步骤
1. 检查DNS解析
2. 验证SSL证书
3. 检查防火墙规则
```

## 9. 发布流程

### 9.1 常规发布
```bash
# 发布步骤
1. 代码审查
2. 测试环境验证
3. 备份当前版本
4. 执行发布脚本
5. 验证新版本
```

### 9.2 回滚机制
```bash
# 回滚步骤
1. 停止当前服务
2. 恢复上一版本代码
3. 恢复数据库（如需要）
4. 重启服务
```

## 10. 性能优化

### 10.1 数据库优化
```sql
-- 性能参数调整
shared_buffers = '1GB'
effective_cache_size = '3GB'
work_mem = '16MB'
maintenance_work_mem = '256MB'
```

### 10.2 应用优化
```bash
# 前端优化
- 启用gzip压缩
- 静态资源CDN
- 代码分割

# 后端优化
- 启用缓存
- 优化查询
- 使用连接池
```

### 10.3 Nginx优化
```nginx
# 性能优化配置
worker_processes auto;
worker_connections 1024;
keepalive_timeout 65;
gzip on;
```

## 11. 维护计划

### 11.1 定期维护
- 每日检查：日志、监控、备份
- 每周检查：系统更新、安全补丁
- 每月检查：性能评估、容量规划

### 11.2 应急预案
- 建立应急响应团队
- 制定故障分级标准
- 准备应急处理流程

### 11.3 文档维护
- 及时更新配置文档
- 记录重要变更
- 维护故障处理手册 