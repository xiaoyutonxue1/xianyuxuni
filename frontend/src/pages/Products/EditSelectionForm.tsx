import React, { useState } from 'react';
import { Form, Input, Select, InputNumber, Button, Switch, Upload, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import type { ProductSelection, ProductCategory, DeliveryMethod, ProductSpec } from '../../types/product';
import useSettingsStore from '../../store/settingsStore';

interface EditSelectionFormProps {
  initialValues: ProductSelection;
  onSubmit: (values: Partial<ProductSelection>) => Promise<void>;
  onCancel: () => void;
}

const EditSelectionForm: React.FC<EditSelectionFormProps> = ({
  initialValues,
  onSubmit,
  onCancel,
}) => {
  const [form] = Form.useForm();
  const [hasSpecs, setHasSpecs] = useState(initialValues.hasSpecs || false);
  const { productSettings } = useSettingsStore();

  // 发货方式选项
  const deliveryMethods = [
    { label: '百度网盘链接', value: '百度网盘链接' },
    { label: '百度网盘群链接', value: '百度网盘群链接' },
    { label: '百度网盘群口令', value: '百度网盘群口令' },
    { label: '夸克网盘链接', value: '夸克网盘链接' },
    { label: '夸克网盘群链接', value: '夸克网盘群链接' },
  ];

  // 处理规格切换
  const handleSpecsChange = (checked: boolean) => {
    setHasSpecs(checked);
    if (!checked) {
      form.setFieldsValue({
        specs: undefined,
        price: initialValues.price,
        stock: initialValues.stock,
        deliveryMethod: initialValues.deliveryMethod,
        deliveryInfo: initialValues.deliveryInfo,
      });
    }
  };

  // 处理表单提交
  const handleSubmit = async (values: any) => {
    try {
      const submitData: Partial<ProductSelection> = {
        ...values,
        id: initialValues.id,
        hasSpecs: hasSpecs,
        source: initialValues.source,
        source_status: initialValues.source_status,
        status: initialValues.status,
        createdAt: initialValues.createdAt,
      };

      await onSubmit(submitData);
    } catch (error) {
      message.error('提交失败');
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={{
        ...initialValues,
        specs: hasSpecs ? initialValues.specs : undefined,
      }}
      onFinish={handleSubmit}
    >
      {/* 基础信息 */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <Form.Item
          name="name"
          label={<span className="text-red-500">选品名称 *</span>}
          rules={[{ required: true, message: '请输入选品名称' }]}
        >
          <Input placeholder="请输入选品名称" />
        </Form.Item>

        <Form.Item
          name="category"
          label="选品分类"
          rules={[{ required: true, message: '请选择选品分类' }]}
        >
          <Select placeholder="请选择选品分类">
            {productSettings?.categories?.map(category => (
              <Select.Option key={category} value={category}>
                {category}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="description"
          label="选品描述"
        >
          <Input.TextArea rows={3} placeholder="请输入选品描述" />
        </Form.Item>

        <Form.Item
          name="coverImage"
          label="选品图片"
          valuePropName="fileList"
          getValueFromEvent={(e) => {
            if (Array.isArray(e)) {
              return e;
            }
            return e?.fileList;
          }}
        >
          <Upload
            name="coverImage"
            listType="picture-card"
            showUploadList={true}
            maxCount={1}
            beforeUpload={(file) => {
              const reader = new FileReader();
              reader.readAsDataURL(file);
              reader.onload = () => {
                form.setFieldsValue({
                  coverImage: reader.result
                });
              };
              return false;
            }}
          >
            <div>
              <PlusOutlined />
              <div style={{ marginTop: 8 }}>上传图片</div>
            </div>
          </Upload>
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
              label="参考价格(元)"
              rules={[{ required: true, message: '请输入参考价格' }]}
            >
              <InputNumber
                min={0}
                placeholder="请输入参考价格"
                style={{ width: '100%' }}
              />
            </Form.Item>

            <Form.Item
              name="stock"
              label="参考库存(件)"
              rules={[{ required: true, message: '请输入参考库存' }]}
            >
              <InputNumber
                min={0}
                placeholder="请输入参考库存"
                style={{ width: '100%' }}
                defaultValue={999}
              />
            </Form.Item>

            <Form.Item
              name="deliveryMethod"
              label="发货方式"
              rules={[{ required: true, message: '请选择发货方式' }]}
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
            name="deliveryInfo"
            label="发货信息"
            rules={[{ required: true, message: '请输入发货信息' }]}
          >
            <Input.TextArea
              placeholder="请输入发货信息"
              rows={3}
            />
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
                      rules={[{ required: true, message: '请输入规格名称' }]}
                    >
                      <Input placeholder="请输入规格名称" />
                    </Form.Item>

                    <div className="grid grid-cols-3 gap-4">
                      <Form.Item
                        {...field}
                        name={[field.name, 'price']}
                        label="参考价格(元)"
                        rules={[{ required: true, message: '请输入参考价格' }]}
                      >
                        <InputNumber
                          min={0}
                          placeholder="请输入参考价格"
                          style={{ width: '100%' }}
                        />
                      </Form.Item>

                      <Form.Item
                        {...field}
                        name={[field.name, 'stock']}
                        label="参考库存(件)"
                        rules={[{ required: true, message: '请输入参考库存' }]}
                      >
                        <InputNumber
                          min={0}
                          placeholder="请输入参考库存"
                          style={{ width: '100%' }}
                          defaultValue={999}
                        />
                      </Form.Item>

                      <Form.Item
                        {...field}
                        name={[field.name, 'deliveryMethod']}
                        label="发货方式"
                        rules={[{ required: true, message: '请选择发货方式' }]}
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
                      {...field}
                      name={[field.name, 'deliveryInfo']}
                      label="发货信息"
                      rules={[{ required: true, message: '请输入发货信息' }]}
                    >
                      <Input.TextArea
                        placeholder="请输入发货信息"
                        rows={3}
                      />
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
  );
};

export default EditSelectionForm; 