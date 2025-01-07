import type { ProductSelection, Product } from '../types/product';

// 检查商品是否缺少某个字段
export const isMissingField = (item: ProductSelection | Product, field: string) => {
  switch(field) {
    case 'name':
      return !item.name;
    case 'category':
      return !item.category;
    case 'images':
      return !item.commonImages || item.commonImages.length === 0;
    case 'price':
      return !item.price;
    case 'stock':
      return !item.stock;
    case 'delivery_method':
      return !item.deliveryMethod;
    case 'delivery_info':
      return !item.deliveryInfo;
    default:
      return false;
  }
};

// 获取商品缺少的字段列表
export const getMissingFields = (item: ProductSelection | Product): string[] => {
  const fields = [
    { key: 'name', label: '商品名称' },
    { key: 'category', label: '商品分类' },
    { key: 'images', label: '公共图片' },
    { key: 'price', label: '售价' },
    { key: 'stock', label: '库存' },
    { key: 'delivery_method', label: '发货方式' },
    { key: 'delivery_info', label: '发货信息' }
  ];

  return fields
    .filter(field => isMissingField(item, field.key))
    .map(field => field.label);
};

// 计算商品的完整度百分比
export const calculateCompleteness = (item: ProductSelection | Product): number => {
  const fields = [
    'name',
    'category',
    'images',
    'price',
    'stock',
    'delivery_method',
    'delivery_info'
  ];

  const filledFields = fields.filter(field => !isMissingField(item, field));
  return Math.round((filledFields.length / fields.length) * 100);
};

// 获取完整度状态
export const getCompletenessStatus = (item: ProductSelection | Product): 'success' | 'warning' | 'error' => {
  const percent = calculateCompleteness(item);
  if (percent === 100) return 'success';
  if (percent >= 60) return 'warning';
  return 'error';
}; 