import React, { useState, useEffect } from 'react';
import { Form, Input, Select, InputNumber, Button, Switch, Space, message, Upload, Tooltip, Progress } from 'antd';
import { InfoCircleFilled, PlusOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import type { ProductSelection } from '../../types/product';
import { categoryOptions, deliveryMethods } from '../../utils/constants';
import useSettingsStore from '../../store/settingsStore';
import { calculateCompleteness, getMissingFields } from '../../utils/productCompleteness';

interface EditProductFormProps {
  initialValues: ProductSelection;
  onSubmit: (values: any) => Promise<void>;
  onCancel: () => void;
}

const EditProductForm: React.FC<EditProductFormProps> = ({
  initialValues,
  onSubmit,
  onCancel,
}) => {
  const [form] = Form.useForm();
  const [hasSpecs, setHasSpecs] = useState(initialValues.hasSpecs);
  const [fileList, setFileList] = useState<UploadFile[]>(
    initialValues.commonImages?.map(img => ({
      uid: img.id,
      url: img.url,
      name: img.id,
      status: 'done',
      size: img.size || 0,
      type: img.type
    })) || []
  );
  const [completeness, setCompleteness] = useState(calculateCompleteness(initialValues));
  const [missingFields, setMissingFields] = useState<string[]>(getMissingFields(initialValues));

  const { productSettings } = useSettingsStore();

  // 更新完整度
  const updateCompleteness = () => {
    const values = form.getFieldsValue();
    const currentData = {
      ...values,
      hasSpecs,
      commonImages: fileList
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
  }, [hasSpecs, fileList]);

  // 处理图片上传前的检查
  const beforeUpload = (file: File) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('只能上传图片文件！');
      return false;
    }
    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      message.error('图片必须小于5MB！');
      return false;
    }
    return true;
  };

  // 图片上传配置
  const uploadProps = {
    listType: 'picture' as const,
    fileList,
    onChange: ({ fileList: newFileList }) => {
      setFileList(newFileList);
    },
    beforeUpload,
    onPreview: async (file: UploadFile) => {
      let src = file.url;
      if (!src && file.originFileObj) {
        src = await new Promise(resolve => {
          const reader = new FileReader();
          reader.readAsDataURL(file.originFileObj as Blob);
          reader.onload = () => resolve(reader.result as string);
        });
      }
      if (src) {
        const image = new Image();
        image.src = src;
        const imgWindow = window.open(src);
        imgWindow?.document.write(image.outerHTML);
      }
    }
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
  };

  // 处理表单提交
  const handleSubmit = async (values: any) => {
    try {
      // 添加公共图片数据
      const submitData = {
        ...values,
        commonImages: fileList.map(file => ({
          id: file.uid,
          url: file.url || file.thumbUrl || '',
          type: 'common' as const,
          sort: fileList.indexOf(file),
          createdAt: new Date().toISOString(),
          size: file.size
        }))
      };

      await onSubmit(submitData);
    } catch (error) {
      message.error('编辑失败');
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={initialValues}
      onFinish={handleSubmit}
      onValuesChange={handleFormChange}
    >
      <div className="mb-4 flex justify-between items-center">
        <span className="text-lg font-medium">编辑商品</span>
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

      <Form.Item
        name="name"
        label="商品名称"
        rules={[{ required: true, message: '请输入商品名称' }]}
      >
        <Input placeholder="请输入商品名称" />
      </Form.Item>

      <Form.Item
        name="category"
        label="商品分类"
        rules={[{ required: true, message: '请选择商品分类' }]}
      >
        <Select placeholder="请选择商品分类">
          {productSettings?.categories?.map(category => (
            <Select.Option key={category} value={category}>
              {category}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>

      {/* 公共图片上传 */}
      <Form.Item
        label={
          <Space>
            公共图片
            <Tooltip title="这些图片会同步到所有店铺，可以拖拽调整顺序，最多上传27张">
              <InfoCircleFilled style={{ color: '#1890ff' }} />
            </Tooltip>
          </Space>
        }
      >
        <div className="bg-gray-50/50 p-4 rounded-lg border border-gray-100">
          <Upload
            {...uploadProps}
            multiple
            className="upload-list-compact"
            maxCount={27}
            listType="picture-card"
            showUploadList={{
              showPreviewIcon: true,
              showRemoveIcon: true,
              showDownloadIcon: false
            }}
            beforeUpload={(file, fileList) => {
              if (fileList.length + 1 > 27) {
                message.error('最多只能上传27张图片');
                return false;
              }
              return beforeUpload(file);
            }}
          >
            {fileList.length >= 27 ? null : (
              <div className="flex flex-col items-center justify-center w-full h-full">
                <PlusOutlined className="text-lg mb-1" />
                <span className="text-xs">上传图片</span>
              </div>
            )}
          </Upload>
          {fileList.length > 0 && (
            <div className="mt-2 text-xs text-gray-400">
              已上传 {fileList.length}/27 张
            </div>
          )}
        </div>
      </Form.Item>

      {/* 规格设置 */}
      <Form.Item label="规格设置">
        <Switch
          checked={hasSpecs}
          onChange={handleSpecsChange}
          checkedChildren="多规格"
          unCheckedChildren="单规格"
        />
      </Form.Item>

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
                      {...field}
                      name={[field.name, 'deliveryInfo']}
                      label="发货信息"
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

export default EditProductForm; 