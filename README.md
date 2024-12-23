# 商品管理系统

## 当前版本
v0.4.1

## 更新历史
### v0.4.1 (2024-12-24)
- 优化登录体验
  - 添加优雅的登录欢迎动画
  - 改进用户名和欢迎语的动画效果
  - 添加彩纸飘落特效
  - 优化动画时序和过渡效果
- 改进用户体验
  - 优化动画流畅度
  - 完善动画交互细节
  - 改进视觉效果

### v0.4.0 (2024-12-23)
- 优化开发环境配置
  - 改进vite配置，添加更多开发服务器选项
  - 优化端口占用处理逻辑
  - 添加CORS支持
  - 完善开发服务器配置
- 改进项目结构
  - 添加index.html入口文件
  - 优化静态资源管理
  - 完善项目文档
  - 更新部署指南

### v0.3.9 (2024-12-23)
- 优化项目结构
  - 重构为前后端分离架构
  - 调整前端目录结构，移动到frontend目录
  - 添加环境配置文件，支持开发/测试/生产环境
  - 优化构建配置，添加路径别名
- 改进开发体验
  - 完善TypeScript配置
  - 优化开发环境代理设置
  - 添加环境变量类型声明
  - 改进构建优化配置

### v0.3.8 (2024-12-23)
- 优化选品管理功能
  - 改进完整度计算逻辑，修复库存检查问题
  - 优化新增选品的默认模式设置
  - 修复删除确认对话框中的乱码问题
  - 完善批量操作按钮的显示
- 改进用户体验
  - 优化表单验证和错误提示
  - 完善数据同步机制
  - 改进界面交互细节

### v0.3.7 (2024-12-23)
- 优化选品编辑功能
  - 统一新增和编辑表单的布局和逻辑
  - 改进表单数据处理机制
  - 完善编辑模式下的表单初始化
  - 优化图片上传和预览功能
- 改进用户体验
  - 统一表单交互方式
  - 优化编辑状态的显示
  - 完善数据验证逻辑

### v0.3.6 (2024-12-23)
- 优化商品导出功能
  - 修复发货方式文件名显示问题
  - 统一发货方式为中文格式
  - 改进数据存储结构
  - 完善类型定义
- 改进数据管理
  - 优化发货方式数据格式
  - 完善数据迁移机制
  - 改进类型安全性

### v0.3.5 (2024-12-22)
- 优化商品管理界面
  - 改进价格和库存的显示格式
  - 添加店铺信息列显示
  - 优化导出功能的文件夹命名规则
  - 完善导出内容的组织结构
- 改进用户体验
  - 统一价格显示格式，保留两位小数
  - 优化库存显示方式
  - 改进店铺信息的展示效果

### v0.3.4 (2024-12-22)
- 优化新增选品功能
  - 改进创建模式选择，支持手动/爬虫两种模式
  - 优化表单显示逻辑，根据不同模式显示对应表单
  - 完善图片上传功能，修复上传问题
  - 改进表单交互体验
- 改进数据管理
  - 移除测试数据生成逻辑
  - 优化数据存储机制
  - 完善数据同步逻辑


## 更新历史
### v0.3.3 (2024-12-21)
- 优化商品编辑功能
  - 修复头图上传和编辑问题
  - 改进图片预览功能
  - 优化表单数据处理
  - 完善图片上传体验
- 改进用户体验
  - 优化表单验证逻辑
  - 完善错误提示信息
  - 改进数据提交机制


### v0.3.2 (2024-12-21)
- 优化商品管理界面
  - 统一图标颜色样式，提升视觉一致性
  - 改进日期筛选图标的显示效果
  - 优化表格列的布局和对齐方式
  - 完善筛选器的交互体验
- 改进用户体验
  - 优化按钮和图标的视觉反馈
  - 统一界面颜色方案
  - 改进筛选器的响应速度

### v0.3.1 (2024-12-21)
- 优化用户体验
  - 改进日期显示格式，更符合中国用户习惯
  - 优化筛选功能，恢复完整的筛选选项
  - 完善工具栏布局和交互
  - 改进筛选条件的重置功能

### v0.3.0 (2024-12-21)
- 优化图片管理功能
  - 移除图片大小限制，支持上传任意大小的图片
  - 优化图片预览功能，支持左右切换
  - 改进图片上传体验，实时显示上传进度
  - 修复编辑时图片显示问题
- 改进用户体验
  - 优化图片预览界面样式
  - 完善图片切换按钮交互
  - 改进预览模态框布局

### v0.2.9 (2024-12-21)
- 优化选品管理功能
  - 修复选品创建功能
  - 完善状态管理逻辑
  - 优化数据存储机制
  - 改进类型定义
- 改进数据结构
  - 添加source_status字段，用于记录选品创建状态
  - 优化状态流转逻辑
  - 完善数据一致性

### v0.2.8 (2024-12-21)
- 优��商品管理功能
  - 添加商品多选功能，支持批量操作
  - 优化日期筛选功能，支持快捷选项
  - 改进商品信息展示，调整标题和名称位置
  - 完善状态显示，移除冗余时间信息
- 改进用户体验
  - 优化日期选择器布局
  - 完善批量操作功能
  - 改进筛选交互体验

### v0.2.7 (2024-12-21)
- 优化商品管理功能
  - 添加商品头图功能支持上传和预览
  - 优化选品分配逻辑，修复数据同步问题
  - 改进商品编辑功能，支持保存头图和发货信息
  - 完善商品列表显示，添加头图预览
- 改进数据管理
  - 优化数据存储结构，添加头图字段
  - 完善数据同步机制
  - 改进数据更新逻辑
- 优化用户体验
  - 优化图片上传组件
  - 完善表单验证
  - 改进错误提示

### v0.2.6 (2024-12-16)
- 优化商品完整度功能
  - 完善完整度计算逻辑，加入公共图片检查
  - 优化完整度显示，添加悬浮提示
  - 统一完整度计算规则
  - 改进未填写项目的展示方式
- 优化图片上传功能
  - 改进图片上传组件布局
  - 优化图片预览和删除功能
  - 统一上传按钮样式
  - 完善图片数量限制提示

### v0.2.5 (2024-12-15)
- 优化选品分配功能
  - 改进店铺分配逻辑，支持同步删除��品数据
  - 优化分配操作的提示信息
  - 完善分配确认弹窗的警告提示
- 改进筛选功能
  - 增强日期筛选功能，支持更多时间范围快捷选项
  - 优化店铺筛选，添加全部店铺选项
  - 改进筛选条件的展示和交互
- 优化用户体验
  - 完善操作反馈信息
  - 优化数据同步机制
  - 改进界面交互细节

### v0.2.4 (2024-12-15)
- 优化选品管理流程
  - 区分新建选品页和选品管理页的状态显示
  - 新建选品页只显示手动/爬虫模式相关状态
  - 选品管理页只显示分配相关状态
- 改进数据管理
  - 统一使用selectionStore管理选品数据
  - 优化数据同步机制
  - 完善状态转换逻辑
- 优化用户体验
  - 简化状态显示
  - 优化消息提示
  - 保留爬虫功能UI占位

### v0.2.3 (2024-12-15)
- 更新修改BUG以及数据逻辑
- 优化使用体验

### v0.2.2 (2024-12-14)
- 优化选品管理功能
  - 添加创建时间排序功能
  - 增加批量操作功能(批量删除和批量导出)
  - 统一选品数据源，优化数据同步
  - 修复选品删除后数据不同步的问题
- 改进数据管理
  - 优化selectionStore实现
  - 完善选品状态管理
  - 改进数据同步机制
- 优化用户体验
  - 添加批量操作确认提示
  - 优化导出数��格式
  - 完善操作反馈

### v0.2.1 (2024-12-14)
- 优化商品分类管理
  - 修复新建选品时分类不同步的问题
  - 将分类选项与系统设置同步
  - 改进分类选择器的交互体验
- 改进选品分配功能
  - 优化选品分配页面布局
  - 完善分配状态显示
  - 支持查看分配历史
- 完善系统设置功能
  - 优化分类管理界面
  - 改进设置保存逻辑
  - 加强设置与功能联动

### v0.2.0 (2024-12-14)
- 优化选品管理流程
  - 重构选品数据管理逻辑
  - 新建商品自动创建选品记录
  - 完善选品状态管理
  - 优化选品分配流程
- 改进数据存储机制
  - 分离商品和选品数据存储
  - 添加 selectionStore 专门管理选品
  - 优化数据同步逻辑
- 完善商品管理功能
  - 优化商品状态显示
  - 改进商品筛选功能
  - 完善商品操作逻辑

### v0.1.9 (2024-12-14)
- 优化店铺设置页面
  - 改进模板管理界面
  - 修复表单交互问题
  - 优化数据保存逻辑
- 修复模板管理功能
  - 修复模板数据保存问题
  - 优化模板编辑体验
  - 完善默认模板功能
- 改进表单交互体验
  - 移除重复的确认按钮
  - 优化表单提交逻辑
  - 完善错误处理机制

### v0.1.8 (2024-12-13)
- 优化商品发布功能
  - 支持���铺组和多店铺批量发布
  - 统一使用模板发布到多个店铺
  - 优化发布流程和交互体验
- 改进商品库页面
  - 显示多店铺发布状态
  - 优化状态筛选逻辑
  - 支持按店铺和发布状态筛选
- 数据结构优化
  - distributeInfo改为数组结构
  - 支持一个商品分配到多个店铺
  - 完善店铺组管理功能

### v0.1.7 (2024-12-13)
- 优化了爬虫模式的状态显示，使用动画图标代替进度条
- 区分了手动模式和爬虫模式的表单字段和完整度计算
- 添加了爬虫状态的完整流程：待爬虫、爬虫进行中、爬虫成功、爬虫失败
- 优化了筛选功能，添加了全选选项和实时筛选
- 添加了新建日期筛选功能
- 更新了数据库文档，添加了爬虫状态说明和状态流转说明
- 优化了爬虫模式下表单验证和错误提示

### v0.1.6 (2024-12-13)
- 完善数据库设计文档
- 优化多规格商品逻辑，现在仅针对发货方式区分
- 规范化发货方式选项
- 添加示例数据

### v0.1.5 (2024-12-13)
- 优化商品表单功能
  - 完善商品分类选项（学习资料、日剧、美剧、漫画、韩剧、国内电视剧、动漫、电子书、电影）
  - 优化发货方式配置（百度网盘链接、百度网盘群链接、百度网盘群口令、夸克网盘链���、夸克网盘群链接）
  - 新增发货信息输入功能，支持填写具体的链接或口令信息
  - 优化多规格商品管理，切换时自动添加默认规格
  - 改进爬虫模式，商品链接设为必填项
  - 优化表单布局和交互体验

### v0.1.4 (2024-12-13)
- 新增商品管理功能
  - 支持手动添加和爬虫抓取两种模式
  - 爬虫模式支持自动抓取商品信息
  - 商品状态实时显示(正常、已下架、抓取中、抓取失败)
  - 支持批量删除商品
- 优化商品编辑功能
  - 支持多规格商品管理
  - 爬虫商品支持链接更新和重新抓取
  - 完善商品发货方式配置
- 改进用户体验
  - 新增商品支持连续添加模式
  - 优化表单验证和错误提示
  - 添加操作确认和状态提示

### v0.1.3 (2024-12-13)
- 优化导航布局，支持展开/收起功能
- 更新导航菜单项名称和路由
- 修复页面布局问题

### v0.1.2 (2024-12-12)
- 添加商品管理功能
- 优化页面布局
- 添加系统设置功能

### v0.1.1 (2024-12-11)
- 初始化项目基础结构
- 添加基础路由配置
- 集成 Ant Design 组件库

### v0.1.0 (2024-12-09)
- 项目初始化

## 功能特性

### 选品管理
- 支持手动创建和爬虫抓取两种方式
- 完整的状态管理和流转逻辑
- 批量操���支持（删除、下架、导出）
- 灵活的筛选和搜索功能
- 数据完整度检查和提示

### 商品管理
- 多规格商品支持
- 灵活的发货方式配置
- 完整的商品信息管理
- 批量操作和导出功能
- 数据统计和分析

### 店铺管理
- 多店铺支持
- 店铺分组管理
- 模板管理功能
- 权限控制

## 开发说明

### 环境要求
- Node.js >= 16
- React >= 18
- TypeScript >= 4.9

### 安装依赖
```bash
npm install
```

### 启动开发服务器
```bash
npm run dev
```

### 构建生产版本
```bash
npm run build
```

## 技术栈
- React
- TypeScript
- Ant Design
- Zustand
- Vite

## 文档
- [数据库设计](./docs/database-schema.md)
- [API文档](./docs/api.md)
- [部署指南](./docs/deployment.md)

## 贡献指南
1. Fork 本仓库
2. 创建新的功能分支
3. 提交您的更改
4. 创建 Pull Request

## 许可证
MIT