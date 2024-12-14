# 数据库架构设计文档

## 版本
v0.2.1

## 系统设置表 (settings)

### 商品分类设置
```json
{
  "categories": [
    "学习资料",
    "日剧",
    "美剧",
    "漫画",
    "韩剧",
    "国内电视剧",
    "动漫",
    "电子书",
    "电影"
  ],
  "categorySettings": {
    "maxLength": 20,
    "allowCustom": false,
    "requireCategory": true
  }
}
```

### 发货方式设置
```json
{
  "deliveryMethods": [
    {
      "id": "baiduDisk",
      "name": "百度网盘链接",
      "isEnabled": true,
      "pattern": "^https?://pan\\.baidu\\.com/s/[a-zA-Z0-9_-]+$",
      "example": "https://pan.baidu.com/s/abc123"
    },
    // ... 其他发货方式
  ]
}
```

// ... existing code ... 