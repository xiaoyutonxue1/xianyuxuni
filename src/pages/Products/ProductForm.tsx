import React, { useState } from 'react';
import { Form, Input, Select, InputNumber, Button, Modal, Switch } from 'antd';
import type { Product, CreateProductRequest } from '../../types/product';

const { Option } = Select;

// 发货方式选项
const deliveryMethods = [
  { label: '百度网盘链接', value: 'baiduDisk' },
  { label: '百度网盘群链接', value: 'baiduDiskGroup' },
  { label: '百度网盘群口令', value: 'baiduDiskGroupCode' },
  { label: '夸克网盘链接', value: 'quarkDisk' },
  { label: '夸克网盘群链接', value: 'quarkDiskGroup' },
];

// 商品分类选项
const categoryOptions = [
  { label: '学习资料', value: 'study' },
  { label: '日剧', value: 'japanese_drama' },
  { label: '美剧', value: 'american_drama' },
  { label: '漫画', value: 'manga' },
  { label: '韩剧', value: 'korean_drama' },
  { label: '国内电视剧', value: 'chinese_drama' },
  { label: '动漫', value: 'anime' },
  { label: '电子书', value: 'ebook' },
  { label: '电影', value: 'movie' },
];

interface ProductFormProps {
  initialData?: Product;
  onSubmit: (values: CreateProductRequest) => Promise<void>;
  loading?: boolean;
  onCancel: () => void;
}

const ProductForm: React.FC<ProductFormProps> = ({
  initialData,
  onSubmit,
  loading = false,
  onCancel
}) => {
  const [form] = Form.useForm();
  const [hasSpecs, setHasSpecs] = useState(initialData?.hasSpecs || false);
  const [addMode, setAddMode] = useState<'manual' | 'crawler'>('manual');

  // 处理规格开关变化
  const handleSpecsChange = (checked: boolean) => {
    setHasSpecs(checked);
    if (checked) {
      // 切换到多规格时，添加一个默认规格
      form.setFieldsValue({
        price: undefined,
        stock: undefined,
        deliveryMethod: undefined,
        deliveryInfo: undefined,
        specs: [{ 
          name: '发货网盘',
          stock: 999,
          deliveryMethod: 'baiduDisk',
          deliveryInfo: ''
        }]
      });
    } else {
      // 切换到单规格时，清空规格信息
      form.setFieldsValue({
        specs: undefined,
        deliveryMethod: 'baiduDisk',
        deliveryInfo: '',
        stock: 999
      });
    }
  };

  // 处理添加模式切换
  const handleModeChange = (mode: 'manual' | 'crawler') => {
    setAddMode(mode);
    form.resetFields(['category', 'productUrl', 'price', 'stock', 'deliveryMethod', 'deliveryInfo', 'specs']);
  };

  // 表单提交处理
  const handleSubmit = async (values: any) => {
    try {
      const submitData: CreateProductRequest = {
        ...values,
        hasSpecs,
        method: addMode,
      };

      if (hasSpecs) {
        // 多规格模式：使用specs字段
        delete submitData.price;
        delete submitData.stock;
        delete submitData.deliveryMethod;
        delete submitData.deliveryInfo;
      } else {
        // 单规格模式：构造saleInfo
        submitData.saleInfo = {
          price: values.price,
          stock: values.stock,
          deliveryMethod: values.deliveryMethod,
          deliveryInfo: values.deliveryInfo,
          originalPrice: values.price // 设置原价等于售价
        };
        delete submitData.price;
        delete submitData.stock;
        delete submitData.deliveryMethod;
        delete submitData.deliveryInfo;
        delete submitData.specs;
      }

      await onSubmit(submitData);
    } catch (error) {
      console.error(error);
    }
  };

  // 获取发货方式对应的占位符文本
  const getDeliveryPlaceholder = (method: string) => {
    switch (method) {
      case 'baiduDisk':
        return '请输入百度网盘链接';
      case 'baiduDiskGroup':
        return '请输入百度网盘群链接';
      case 'baiduDiskGroupCode':
        return '请输入百度网盘群口令';
      case 'quarkDisk':
        return '请输入夸克网盘链接';
      case 'quarkDiskGroup':
        return '请输入夸克网盘群链接';
      default:
        return '请输入发货信息';
    }
  };

  return (
    <Modal
      title="新增商品"
      open={true}
      onCancel={onCancel}
      footer={null}
      width={800}
    >
      <div className="p-4">
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            ...initialData,
            specs: hasSpecs ? [{ 
              name: '发货网盘',
              stock: 999,
              deliveryMethod: 'baiduDisk',
              deliveryInfo: ''
            }] : undefined,
            stock: 999,
            deliveryMethod: 'baiduDisk',
            deliveryInfo: ''
          }}
          onFinish={handleSubmit}
        >
          {/* 添加模式 */}
          <div className="mb-4">
            <div className="text-sm mb-2">添加模式</div>
            <div className="space-x-2">
              <Button 
                type={addMode === 'manual' ? 'primary' : 'default'}
                onClick={() => handleModeChange('manual')}
              >
                手动添加
              </Button>
              <Button
                type={addMode === 'crawler' ? 'primary' : 'default'}
                onClick={() => handleModeChange('crawler')}
              >
                爬虫抓取
              </Button>
            </div>
          </div>

          {/* 基础信息 */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <Form.Item
              name="name"
              label={<span className="text-red-500">商品名称 *</span>}
              rules={[{ required: true, message: '请输入商品名称' }]}
            >
              <Input placeholder="请输入商品名称" />
            </Form.Item>

            {addMode === 'manual' ? (
              <Form.Item
                name="category"
                label="商品分类"
              >
                <Select placeholder="请选择商品分类">
                  {categoryOptions.map(option => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            ) : (
              <Form.Item
                name="productUrl"
                label={<span className="text-red-500">商品链接 *</span>}
                rules={[{ required: true, message: '请输入商品链接' }]}
              >
                <Input placeholder="请输入商品链接" />
              </Form.Item>
            )}
          </div>

          {/* 规格设置 - 仅在手动添加模式下显示 */}
          {addMode === 'manual' && (
            <>
              <div className="mb-4">
                <Form.Item label="规格设置" className="mb-0">
                  <Switch
                    checked={hasSpecs}
                    onChange={handleSpecsChange}
                    checkedChildren="多规格"
                    unCheckedChildren="单规格"
                  />
                </Form.Item>
              </div>

              {/* 单规格信息 */}
              {!hasSpecs && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <Form.Item
                      name="price"
                      label="售价(元)"
                    >
                      <InputNumber
                        min={0}
                        placeholder="请输入售价"
                        style={{ width: '100%' }}
                      />
                    </Form.Item>

                    <Form.Item
                      name="stock"
                      label="库存(件)"
                    >
                      <InputNumber
                        min={0}
                        placeholder="请输入库存"
                        style={{ width: '100%' }}
                        defaultValue={999}
                      />
                    </Form.Item>

                    <Form.Item
                      name="deliveryMethod"
                      label="发货方式"
                    >
                      <Select placeholder="请选择发货方式">
                        {deliveryMethods.map(method => (
                          <Option key={method.value} value={method.value}>
                            {method.label}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </div>

                  <Form.Item
                    noStyle
                    shouldUpdate={(prevValues, currentValues) => prevValues.deliveryMethod !== currentValues.deliveryMethod}
                  >
                    {({ getFieldValue }) => {
                      const currentMethod = getFieldValue('deliveryMethod');
                      return currentMethod ? (
                        <Form.Item
                          name="deliveryInfo"
                          label="发货信息"
                        >
                          <Input.TextArea
                            placeholder={getDeliveryPlaceholder(currentMethod)}
                            rows={3}
                          />
                        </Form.Item>
                      ) : null;
                    }}
                  </Form.Item>
                </div>
              )}

              {/* 多规格表单 */}
              {hasSpecs && (
                <Form.List
                  name="specs"
                  initialValue={[{ 
                    name: '发货网盘',
                    stock: 999,
                    deliveryMethod: 'baiduDisk',
                    deliveryInfo: ''
                  }]}
                >
                  {(fields, { add, remove }, { errors }) => (
                    <div className="space-y-4">
                      {fields.map((field, index) => (
                        <div
                          key={field.key}
                          className="bg-gray-50 p-4 rounded-lg"
                        >
                          <div className="flex justify-between items-center mb-4">
                            <span>规格 {index + 1}</span>
                            <Button
                              type="link"
                              danger
                              onClick={() => remove(field.name)}
                            >
                              删除
                            </Button>
                          </div>

                          <div className="grid grid-cols-1 gap-4">
                            <Form.Item
                              {...field}
                              name={[field.name, 'name']}
                              label="规格名称"
                            >
                              <Input placeholder="请输入规格名称" />
                            </Form.Item>

                            <div className="grid grid-cols-3 gap-4">
                              <Form.Item
                                {...field}
                                name={[field.name, 'price']}
                                label="售价(元)"
                              >
                                <InputNumber
                                  min={0}
                                  placeholder="请输入售价"
                                  style={{ width: '100%' }}
                                />
                              </Form.Item>

                              <Form.Item
                                {...field}
                                name={[field.name, 'stock']}
                                label="库存(件)"
                              >
                                <InputNumber
                                  min={0}
                                  placeholder="请输入库存"
                                  style={{ width: '100%' }}
                                  defaultValue={999}
                                />
                              </Form.Item>

                              <Form.Item
                                {...field}
                                name={[field.name, 'deliveryMethod']}
                                label="发货方式"
                              >
                                <Select placeholder="请选择发货方式">
                                  {deliveryMethods.map(method => (
                                    <Option key={method.value} value={method.value}>
                                      {method.label}
                                    </Option>
                                  ))}
                                </Select>
                              </Form.Item>
                            </div>

                            <Form.Item
                              noStyle
                              shouldUpdate={(prevValues, currentValues) => {
                                const prevMethod = prevValues.specs?.[index]?.deliveryMethod;
                                const currentMethod = currentValues.specs?.[index]?.deliveryMethod;
                                return prevMethod !== currentMethod;
                              }}
                            >
                              {({ getFieldValue }) => {
                                const currentMethod = getFieldValue(['specs', index, 'deliveryMethod']);
                                return currentMethod ? (
                                  <Form.Item
                                    {...field}
                                    name={[field.name, 'deliveryInfo']}
                                    label="发货信息"
                                  >
                                    <Input.TextArea
                                      placeholder={getDeliveryPlaceholder(currentMethod)}
                                      rows={3}
                                    />
                                  </Form.Item>
                                ) : null;
                              }}
                            </Form.Item>
                          </div>
                        </div>
                      ))}

                      <Button
                        type="dashed"
                        onClick={() => add()}
                        block
                      >
                        + 添加规格
                      </Button>
                      <Form.ErrorList errors={errors} />
                    </div>
                  )}
                </Form.List>
              )}
            </>
          )}

          <div className="flex justify-end mt-6 space-x-2">
            <Button onClick={onCancel}>
              取消
            </Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              确定
            </Button>
          </div>
        </Form>
      </div>
    </Modal>
  );
};

export default ProductForm;