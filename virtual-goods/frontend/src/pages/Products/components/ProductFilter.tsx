import React, { useEffect } from 'react';
import { Form, Select, Space, Button } from 'antd';
import { deliveryMethods, categoryOptions } from '../../../utils/constants';
import type { ProductFilterProps } from '../../../types/product';

const { Option } = Select;

// 完整度选项
const COMPLETENESS_OPTIONS = [
  { label: '全部完整度', value: '' },
  { label: '完整商品', value: 'complete' },
  { label: '不完整商品', value: 'incomplete' },
  { type: 'divider' },
  { label: '缺少商品名称', value: 'missing_name' },
  { label: '缺少商品分类', value: 'missing_category' },
  { label: '缺少公共图片', value: 'missing_images' },
  { label: '缺少售价', value: 'missing_price' },
  { label: '缺少库存', value: 'missing_stock' },
  { label: '缺少发货方式', value: 'missing_delivery_method' },
  { label: '缺少发货信息', value: 'missing_delivery_info' }
];

// 规格类型选项
const SPEC_TYPE_OPTIONS = [
  { label: '全部规格', value: 'all' },
  { label: '单规格商品', value: 'single' },
  { label: '多规格商品', value: 'multiple' },
];

// 添加全选选项到分类和发货方式
const allCategoryOptions = [
  { label: '全部分类', value: 'all' },
  ...categoryOptions
];

const allDeliveryMethods = [
  { 
    label: '全部发货方式', 
    value: '',
    pattern: '',
    example: '',
    placeholder: ''
  },
  ...deliveryMethods
];

const ProductFilter: React.FC<ProductFilterProps> = ({ onFilter }) => {
  const [form] = Form.useForm();

  // 重置筛选
  const handleReset = () => {
    form.setFieldsValue({
      category: 'all',
      completeness: '',
      specType: 'all',
      deliveryMethod: ''
    });
    onFilter({});
  };

  // 处理表单值变化
  const handleValuesChange = (changedValues: any, allValues: any) => {
    // 处理全选值
    const processedValues = Object.entries(allValues).reduce((acc: any, [key, value]) => {
      if (value === 'all' || value === '') {
        return acc;
      }
      acc[key] = value;
      return acc;
    }, {});
    
    onFilter(processedValues);
  };

  // 初始化默认值
  useEffect(() => {
    form.setFieldsValue({
      category: 'all',
      completeness: '',
      specType: 'all',
      deliveryMethod: ''
    });
  }, [form]);

  return (
    <Form
      form={form}
      layout="inline"
      onValuesChange={handleValuesChange}
      style={{ marginBottom: 16, padding: 16, background: '#f5f5f5', borderRadius: 4 }}
    >
      {/* 分类筛选 */}
      <Form.Item name="category" label="商品分类">
        <Select
          style={{ width: 160 }}
          placeholder="选择分类"
        >
          {allCategoryOptions.map(option => (
            <Option key={option.value} value={option.value}>
              {option.label}
            </Option>
          ))}
        </Select>
      </Form.Item>

      {/* 完整度筛选 */}
      <Form.Item name="completeness" label="完整度">
        <Select
          style={{ width: 160 }}
          placeholder="选择完整度"
        >
          {COMPLETENESS_OPTIONS.map(option => (
            <Option key={option.value} value={option.value}>
              {option.label}
            </Option>
          ))}
        </Select>
      </Form.Item>

      {/* 规格类型筛选 */}
      <Form.Item name="specType" label="规格类型">
        <Select
          style={{ width: 160 }}
          placeholder="选择规格类型"
        >
          {SPEC_TYPE_OPTIONS.map(option => (
            <Option key={option.value} value={option.value}>
              {option.label}
            </Option>
          ))}
        </Select>
      </Form.Item>

      {/* 发货方式筛选 */}
      <Form.Item name="deliveryMethod" label="发货方式">
        <Select
          style={{ width: 160 }}
          placeholder="选择发货方式"
        >
          {allDeliveryMethods.map(method => (
            <Option key={method.value} value={method.value}>
              {method.label}
            </Option>
          ))}
        </Select>
      </Form.Item>

      {/* 操作按钮 */}
      <Form.Item>
        <Button onClick={handleReset}>
          重置
        </Button>
      </Form.Item>
    </Form>
  );
};

export default ProductFilter; 