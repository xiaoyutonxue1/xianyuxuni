import React, { useState, useEffect } from 'react';
import { Form, Input, Select, InputNumber, Button, Switch, Progress, Tooltip, Space } from 'antd';
import { InfoCircleFilled, CheckCircleFilled } from '@ant-design/icons';
import type { Product, CreateProductRequest, UpdateProductRequest } from '../../types/product';
import { categoryOptions, deliveryMethods } from '../../utils/constants';
import { calculateCompleteness, getMissingFields, getCompletenessStatus } from '../../utils/productCompleteness';

interface EditProductFormProps {
  initialValues?: Partial<Product>;
  onSubmit: (values: CreateProductRequest | UpdateProductRequest) => void;
  onCancel: () => void;
}

const EditProductForm: React.FC<EditProductFormProps> = ({
  initialValues,
  onSubmit,
  onCancel
}) => {
  const [form] = Form.useForm();
  const [hasSpecs, setHasSpecs] = useState(initialValues?.hasSpecs || false);
  const [completeness, setCompleteness] = useState(0);
  const [missingFields, setMissingFields] = useState<string[]>([]);

  // 获取当前发货方式的配置
  const getDeliveryMethodConfig = (methodValue: string) => {
    return deliveryMethods.find(method => method.value === methodValue);
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

  // 更新完整度
  const updateCompleteness = () => {
    const values = form.getFieldsValue();
    const currentData = {
      ...initialValues,
      ...values,
      hasSpecs
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
  }, [hasSpecs]);

  return (
    <div className="p-4">
      <div className="mb-4 flex justify-between items-center">
        <span className="text-lg font-medium">编辑商品</span>
        <Tooltip
          title={
            missingFields.length > 0 ? (
              <div className="p-2">
                <div className="flex items-center space-x-1 text-red-500 mb-2">
                  <InfoCircleFilled />
                  <span>未填写项目</span>
                </div>
                <div className="bg-red-50 rounded-md p-2">
                  {missingFields.map((field, index) => (
                    <div key={index} className="text-red-400 py-0.5">
                      • {field}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-2 text-green-500">
                <CheckCircleFilled />
                <span>所有必要信息已填写完整</span>
              </div>
            )
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
          <div className="flex items-center space-x-2 cursor-pointer">
            <Progress
              percent={completeness}
              size="small"
              status={getCompletenessStatus(completeness)}
              format={(percent) => (
                <span style={{ fontSize: '12px' }}>
                  {percent}%
                </span>
              )}
              strokeColor={{
                '0%': '#108ee9',
                '100%': '#87d068',
              }}
              style={{ width: 120, margin: 0 }}
            />
            {missingFields.length > 0 ? (
              <InfoCircleFilled className="text-warning" />
            ) : (
              <CheckCircleFilled className="text-success" />
            )}
          </div>
        </Tooltip>
      </div>

      <Form
        form={form}
        layout="vertical"
        initialValues={initialValues}
        onFinish={onSubmit}
        onValuesChange={handleFormChange}
      >
        {/* 基础信息 */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <Form.Item
            name="name"
            label={<span className="text-red-500">商品名称 *</span>}
            rules={[{ required: true, message: '请输入商品名称' }]}
          >
            <Input placeholder="请输入商品名称" />
          </Form.Item>

          <Form.Item
            name="category"
            label="商品分类"
          >
            <Select placeholder="请选择商品分类">
              {categoryOptions.map(option => (
                <Select.Option key={option.value} value={option.value}>
                  {option.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </div>

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
                    // 切换发货方式时清空发货信息
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
                const methodConfig = getDeliveryMethodConfig(currentMethod);
                
                return methodConfig ? (
                  <Form.Item
                    name="deliveryInfo"
                    label="发货信息"
                    rules={[
                      { validator: validateDeliveryInfo }
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
                          const methodConfig = getDeliveryMethodConfig(currentMethod);
                          
                          return methodConfig ? (
                            <Form.Item
                              {...field}
                              name={[field.name, 'deliveryInfo']}
                              label="发货信息"
                              rules={[
                                { validator: validateDeliveryInfo }
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

        <div className="flex justify-end mt-6 space-x-2">
          <Button onClick={onCancel}>
            取消
          </Button>
          <Button type="primary" htmlType="submit">
            确定
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default EditProductForm; 