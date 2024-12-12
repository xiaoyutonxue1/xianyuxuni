# 虚拟商品管理系统

基于React + Ant Design的虚拟商品管理系统，用于管理电商平台的虚拟商品。

## 功能特性

- 选品管理
  - 支持爬虫选品和手动选品
  - 选品数据导出
  - 状态追踪
  
- 上品管理
  - 多店铺商品管理
  - 批量上架功能
  - 商品图片管理（头图/公共图片）
  
- 商品描述模板（开发中）
  - 多账号模板管理
  - 模板快速复制
  
- 发货设置（开发中）
  - 批量设置发货信息
  - 关联商品品类
  
- 数据可视化（开发中）
  - 销售数据统计
  - 店铺绩效分析

## 技术栈

- React 18
- TypeScript
- Ant Design 5.x
- Vite
- Zustand
- React Router 6
- Tailwind CSS

## 开发环境要求

- Node.js >= 18.17.0
- npm >= 9.6.7

## 安装和运行

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

## 版本历史

### v0.1.1 (2024-03-18)
- 新增模板管理模块
  - 支持创建和编辑商品描述模板
  - 支持模板变量配置
  - 支持模板预览功能
- 新增发货设置模块
  - 支持配置发货信息
  - 支持关联商品分类
- 完善商品管理功能
  - 新增批量编辑功能
  - 新增商品复制功能
  - 优化商品列表展示
- 优化数据看板
  - 新增销售趋势图表
  - 完善数据统计展示
- 其他改进
  - 优化页面加载性能
  - 修复已知问题
  - 改进用户体验

### v0.0.1 (2024-03-11)
- 初始化项目
- 完成商品管理模块基础功能
  - 选品管理
  - 上品管理
  - 基础数据展示

## 项目结构

```
src/
├── components/     # 公共组件
├── pages/         # 页面组件
├── store/         # 状态管理
├── types/         # TypeScript类型定义
└── utils/         # 工具函数
```

## 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 许可证

[MIT](LICENSE) 