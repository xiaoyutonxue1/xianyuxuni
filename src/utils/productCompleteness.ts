import type { ProductSelection } from '../types/product';

// 计算商品完整度
export const calculateCompleteness = (record: any) => {
  let completedFields = 0;
  let totalFields = 0;

  // 根据不同模式计算完整度
  if (record.source === 'crawler') {
    // 爬虫模式只需要检查必要字段
    const crawlerFields = ['name', 'productUrl'];
    totalFields = crawlerFields.length;
    crawlerFields.forEach(field => {
      if (record[field]) completedFields++;
    });
  } else {
    // 手动模式需要检查所有字段
    // 基础信息
    const baseFields = ['name', 'category'];
    totalFields += baseFields.length;
    baseFields.forEach(field => {
      if (record[field]) completedFields++;
    });

    // 检查头图
    totalFields += 1;
    if (record.coverImage) completedFields++;

    // 检查商品标题和文案
    totalFields += 2;
    if (record.distributedTitle?.trim()) completedFields++;
    if (record.distributedContent?.trim()) completedFields++;

    // 检查公共图片
    totalFields += 1;
    if (record.commonImages && record.commonImages.length > 0) {
      completedFields++;
    }

    // 检查销售信息
    if (record.hasSpecs) {
      // 多规格模式
      if (record.specs && record.specs.length > 0) {
        record.specs.forEach((spec: any) => {
          const specFields = ['name', 'price', 'stock', 'deliveryMethod', 'deliveryInfo'];
          totalFields += specFields.length;
          specFields.forEach(field => {
            if (spec[field]) completedFields++;
          });
        });
      }
    } else {
      // 单规格模式
      const saleFields = ['price', 'stock', 'deliveryMethod', 'deliveryInfo'];
      totalFields += saleFields.length;
      saleFields.forEach(field => {
        if (record[field]) completedFields++;
      });
    }
  }

  return Math.round((completedFields / totalFields) * 100);
};

// 获取未填写的字段
export const getMissingFields = (record: any) => {
  const missingFields = [];

  if (record.source === 'crawler') {
    // 爬虫模式
    if (!record.name) missingFields.push('商品名称');
    if (!record.productUrl) missingFields.push('商品链接');
  } else {
    // 手动模式
    // 检查基础信息
    if (!record.name) missingFields.push('��品名称');
    if (!record.category) missingFields.push('商品分类');
    
    // 检查头图
    if (!record.coverImage) missingFields.push('商品头图');

    // 检查商品标题和文案
    if (!record.distributedTitle?.trim()) missingFields.push('商品标题');
    if (!record.distributedContent?.trim()) missingFields.push('商品文案');
    
    // 检查公共图片
    if (!record.commonImages || record.commonImages.length === 0) {
      missingFields.push('公共图片');
    }

    // 检查销售信息
    if (record.hasSpecs) {
      // 多规格模式
      if (!record.specs || record.specs.length === 0) {
        missingFields.push('规格信息');
      } else {
        record.specs.forEach((spec: any, index: number) => {
          if (!spec.name) missingFields.push(`规格${index + 1}名称`);
          if (!spec.price) missingFields.push(`规格${index + 1}价格`);
          if (!spec.stock) missingFields.push(`规格${index + 1}库存`);
          if (!spec.deliveryMethod) missingFields.push(`规格${index + 1}发货方式`);
          if (!spec.deliveryInfo) missingFields.push(`规格${index + 1}发货信息`);
        });
      }
    } else {
      // 单规格模式
      if (!record.price) missingFields.push('商品价格');
      if (!record.stock) missingFields.push('商品库存');
      if (!record.deliveryMethod) missingFields.push('发货方式');
      if (!record.deliveryInfo) missingFields.push('发货信息');
    }
  }

  return missingFields;
};

// 获取完整度状态
export const getCompletenessStatus = (percent: number) => {
  if (percent >= 90) return 'success';
  if (percent >= 60) return 'normal';
  return 'exception';
}; 