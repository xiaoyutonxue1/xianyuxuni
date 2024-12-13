import React, { useEffect } from 'react';
import { Form, Select, Space, Button, DatePicker } from 'antd';
import { deliveryMethods, categoryOptions } from '../../../utils/constants';
import dayjs from 'dayjs';

interface ProductFilterProps {
  onFilter: (values: any) => void;
}

const { Option } = Select;
const { RangePicker } = DatePicker;

// 完整度选项
const COMPLETENESS_OPTIONS = [
  { label: '全部完整度', value: 'all' },
  { label: '100% 完整', value: '100' },
  { label: '80-99% 较完整', value: '80-99' },
  { label: '60-79% 部分完整', value: '60-79' },
  { label: '60% 以下 待完善', value: '0-59' },
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
    value: 'all',
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
      completeness: 'all',
      specType: 'all',
      deliveryMethod: 'all',
      dateRange: null
    });
    onFilter({});
  };

  // 处理表单值变化
  const handleValuesChange = (changedValues: any, allValues: any) => {
    // 处理全选值和日期范围
    const processedValues = Object.entries(allValues).reduce((acc: any, [key, value]) => {
      if (value === 'all') {
        return acc;
      }
      if (key === 'dateRange' && value) {
        acc.startDate = value[0].format('YYYY-MM-DD');
        acc.endDate = value[1].format('YYYY-MM-DD');
      } else if (key !== 'dateRange') {
        acc[key] = value;
      }
      return acc;
    }, {});
    
    onFilter(processedValues);
  };

  // 初始化默认值
  useEffect(() => {
    form.setFieldsValue({
      category: 'all',
      completeness: 'all',
      specType: 'all',
      deliveryMethod: 'all',
      dateRange: null
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

      {/* 创建日期筛选 */}
      <Form.Item name="dateRange" label="创建日期">
        <RangePicker
          style={{ width: 260 }}
          placeholder={['开始日期', '结束日期']}
          allowClear
          ranges={{
            '今天': [dayjs().startOf('day'), dayjs().endOf('day')],
            '本周': [dayjs().startOf('week'), dayjs().endOf('week')],
            '本月': [dayjs().startOf('month'), dayjs().endOf('month')],
            '最近7天': [dayjs().subtract(6, 'day'), dayjs()],
            '最近30天': [dayjs().subtract(29, 'day'), dayjs()]
          }}
        />
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