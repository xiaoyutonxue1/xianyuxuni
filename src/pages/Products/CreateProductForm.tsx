import React, { useState, useEffect } from 'react';
import { Form, Input, Select, InputNumber, Button, Switch, Progress, Tooltip, Space, message } from 'antd';
import { InfoCircleFilled, CheckCircleFilled } from '@ant-design/icons';
import type { CreateProductRequest } from '../../types/product';
import { categoryOptions, deliveryMethods } from '../../utils/constants';
import { calculateCompleteness, getMissingFields, getCompletenessStatus } from '../../utils/productCompleteness';
import useSelectionStore from '../../store/selectionStore';
import useSettingsStore from '../../store/settingsStore';

interface CreateProductFormProps {
  onSubmit: (values: CreateProductRequest) => Promise<void>;
  loading?: boolean;
  onCancel: () => void;
}

const CreateProductForm: React.FC<CreateProductFormProps> = ({
  onSubmit,
  loading = false,
  onCancel
}) => {
  const [form] = Form.useForm();
  const [hasSpecs, setHasSpecs] = useState(false);
  const [addMode, setAddMode] = useState<'manual' | 'crawler'>('manual');
  const [completeness, setCompleteness] = useState(0);
  const [missingFields, setMissingFields] = useState<string[]>([]);

  // 使用 selectionStore
  const { addSelection } = useSelectionStore();
  const { productSettings } = useSettingsStore();

  // 获取当前发货方式的配置
  const getDeliveryMethodConfig = (methodValue: string) => {
    return deliveryMethods.find(method => method.value === methodValue);
  };

  // 获取分类选项
  const getCategoryOptions = () => {
    if (!productSettings?.categories) {
      return [];
    }
    return productSettings.categories.map(category => ({
      label: category,
      value: category
    }));
  };

  // 验证发货信息格式
  const validateDeliveryInfo = (_: any, value: string) => {
    const currentMethod = form.getFieldValue('deliveryMethod');
    const methodConfig = getDeliveryMethodConfig(currentMethod);
    
    if (!methodConfig) return Promise.resolve();
    
    const pattern = new RegExp(methodConfig.pattern);
    if (!pattern.test(value)) {
      return Promise.reject(new Error(`格式错误，正确示例：${methodConfig.example}`));
    }
    return Promise.resolve();
  };

  // 处理规格开关变化
  const handleSpecsChange = (checked: boolean) => {
    setHasSpecs(checked);
    if (checked) {
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
      form.setFieldsValue({
        specs: undefined,
        deliveryMethod: 'baiduDisk',
        deliveryInfo: '',
        stock: 999
      });
    }
    updateCompleteness();
  };

  // 处理添加模式切换
  const handleModeChange = (mode: 'manual' | 'crawler') => {
    setAddMode(mode);
    form.resetFields();
    form.setFieldsValue({
      method: mode,
      stock: 999,
      deliveryMethod: 'baiduDisk',
      deliveryInfo: ''
    });
    updateCompleteness();
  };

  // 更新完整度
  const updateCompleteness = () => {
    const values = form.getFieldsValue();
    const currentData = {
      ...values,
      hasSpecs,
      method: addMode,
    };
    const percent = calculateCompleteness(currentData);
    const missing = getMissingFields(currentData);
    setCompleteness(percent);
    setMissingFields(missing);
  };

  // 监听表单值变化
  const handleFormChange = () => {
    updateCompleteness();
  };

  // 初始化时计算完整度
  useEffect(() => {
    updateCompleteness();
  }, [hasSpecs, addMode]);

  // 处理表单提交
  const handleSubmit = async (values: any) => {
    try {
      await onSubmit(values);
      message.success('创建成功');
      form.resetFields();
      updateCompleteness();
    } catch (error) {
      message.error('创建失败');
    }
  };

  return (
    <div className="p-4">
      <div className="mb-4 flex justify-between items-center">
        <span className="text-lg font-medium">新增商品</span>
        <Tooltip
          title={
            missingFields.length > 0 ? (
              <div className="p-2">
                <div className="text-base text-red-500 mb-2">
                  未填写项目
                </div>
                <div className="bg-red-50 rounded p-2">
                  {missingFields.map((field, index) => (
                    <div key={index} className="text-red-400 py-0.5">
                      • {field}
                    </div>
                  ))}
                </div>
              </div>
            ) : null
          }
          overlayStyle={{ 
            maxWidth: '400px',
            borderRadius: '8px',
          }}
          overlayInnerStyle={{
            borderRadius: '8px',
          }}
          color="#fff"
          placement="bottomRight"
        >
          <div className="cursor-pointer" style={{ width: '300px' }}>
            <Progress
              percent={completeness}
              size="small"
              format={(percent) => (
                <span style={{ fontSize: '12px' }}>
                  {percent}%
                </span>
              )}
              strokeColor={{
                '0%': '#108ee9',
                '100%': '#87d068',
              }}
              style={{ margin: 0 }}
            />
          </div>
        </Tooltip>
      </div>

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

      <Form
        form={form}
        layout="vertical"
        initialValues={{
          method: 'manual',
          stock: 999,
          deliveryMethod: 'baiduDisk',
          deliveryInfo: ''
        }}
        onFinish={handleSubmit}
        onValuesChange={handleFormChange}
      >
        {/* 隐藏的方法字段 */}
        <Form.Item name="method" hidden>
          <Input />
        </Form.Item>

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
              rules={[{ required: true, message: '请选择商品分类' }]}
            >
              <Select placeholder="请选择商品分类">
                {getCategoryOptions().map(option => (
                  <Select.Option key={option.value} value={option.value}>
                    {option.label}
                  </Select.Option>
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

        {/* 手动模式特有的表单项 */}
        {addMode === 'manual' && (
          <>
            {/* 规格设置 */}
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
                    <Select 
                      placeholder="请选择发货方式"
                      onChange={() => {
                        form.setFieldValue('deliveryInfo', '');
                      }}
                    >
                      {deliveryMethods.map(method => (
                        <Select.Option key={method.value} value={method.value}>
                          {method.label}
                        </Select.Option>
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
                    const methodConfig = deliveryMethods.find(method => method.value === currentMethod);
                    
                    return methodConfig ? (
                      <Form.Item
                        name="deliveryInfo"
                        label="发货信息"
                        rules={[
                          { 
                            pattern: new RegExp(methodConfig.pattern),
                            message: `格式错误，正确示例：${methodConfig.example}`
                          }
                        ]}
                        tooltip={methodConfig.example}
                      >
                        <Input.TextArea
                          placeholder={methodConfig.placeholder}
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
              <Form.List name="specs">
                {(fields, { add, remove }) => (
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
                                  <Select.Option key={method.value} value={method.value}>
                                    {method.label}
                                  </Select.Option>
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
                              const methodConfig = deliveryMethods.find(method => method.value === currentMethod);
                              
                              return methodConfig ? (
                                <Form.Item
                                  {...field}
                                  name={[field.name, 'deliveryInfo']}
                                  label="发货信息"
                                  rules={[
                                    { 
                                      pattern: new RegExp(methodConfig.pattern),
                                      message: `格式错误，正确示例：${methodConfig.example}`
                                    }
                                  ]}
                                  tooltip={methodConfig.example}
                                >
                                  <Input.TextArea
                                    placeholder={methodConfig.placeholder}
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
  );
};

export default CreateProductForm; 