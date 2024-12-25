import type { ProductSelection } from '../types/product';

// 检查选品是否缺少某个字段
export const isMissingField = (selection: ProductSelection, field: string) => {
  switch(field) {
    case 'name':
      return !selection.name;
    case 'category':
      return !selection.category;
    case 'images':
      return !selection.commonImages || selection.commonImages.length === 0;
    case 'price':
      return !selection.price;
    case 'stock':
      return !selection.stock;
    case 'delivery_method':
      return !selection.deliveryMethod;
    case 'delivery_info':
      return !selection.deliveryInfo;
    default:
      return false;
  }
};

// 获取选品缺少的字段列表
export const getMissingFields = (selection: ProductSelection): string[] => {
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
    .filter(field => isMissingField(selection, field.key))
    .map(field => field.label);
};

// 计算选品的完整度百分比
export const calculateCompleteness = (selection: ProductSelection): number => {
  const fields = [
    'name',
    'category',
    'images',
    'price',
    'stock',
    'delivery_method',
    'delivery_info'
  ];

  const filledFields = fields.filter(field => !isMissingField(selection, field));
  return Math.round((filledFields.length / fields.length) * 100);
};

// 获取完整度状态
export const getCompletenessStatus = (selection: ProductSelection): 'success' | 'warning' | 'error' => {
  const percent = calculateCompleteness(selection);
  if (percent === 100) return 'success';
  if (percent >= 60) return 'warning';
  return 'error';
}; 