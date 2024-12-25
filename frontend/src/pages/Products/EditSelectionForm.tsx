import React, { useState } from 'react';
import { Form, Input, Select, InputNumber, Button, Switch, Upload, message, Space, Tooltip } from 'antd';
import { PlusOutlined, InfoCircleOutlined, DeleteOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import useSettingsStore from '../../store/settingsStore';
import { deliveryMethods, deliveryInfoConfig } from '../../utils/constants';
import type { ProductSelection } from '../../types/product';

interface EditSelectionFormProps {
  initialValues?: ProductSelection;
  onSubmit: (values: any) => Promise<void>;
  onCancel: () => void;
}

const EditSelectionForm: React.FC<EditSelectionFormProps> = ({
  initialValues,
  onSubmit,
  onCancel,
}) => {
  const [form] = Form.useForm();
  const [hasSpecs, setHasSpecs] = useState(initialValues?.hasSpecs || false);
  const [coverImageList, setCoverImageList] = useState<UploadFile[]>(
    initialValues?.coverImage ? [{
      uid: '-1',
      name: 'cover-image',
      status: 'done',
      url: initialValues.coverImage,
      type: 'image/jpeg',
      thumbUrl: initialValues.coverImage
    }] : []
  );
  const [fileList, setFileList] = useState<UploadFile[]>(
    initialValues?.commonImages?.map(img => ({
      uid: img.id,
      url: img.url,
      thumbUrl: img.thumbUrl,
      name: img.id,
      status: 'done',
      size: img.size || 0,
      type: 'common'
    })) || []
  );
  const [currentDeliveryMethod, setCurrentDeliveryMethod] = useState<string>(
    initialValues?.deliveryMethod || 'baiduDisk'
  );

  const { productSettings } = useSettingsStore();

  // 处理发货方式变化
  const handleDeliveryMethodChange = (value: string) => {
    setCurrentDeliveryMethod(value);
    // 清空发货信息
    form.setFieldValue('deliveryInfo', '');
  };

  // 获取文件的 base64 数据
  const getBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  // 生成缩略图
  const generateThumbnail = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // 设置缩略图尺寸
        const maxWidth = 200;
        const maxHeight = 200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = height * (maxWidth / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = width * (maxHeight / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };

      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  };

  // 图片上传配置
  const uploadProps = {
    listType: 'picture-card' as const,
    fileList,
    onChange: async ({ fileList: newFileList }: { fileList: UploadFile[] }) => {
      // 处理新上传的文件
      const processedFileList = await Promise.all(
        newFileList.map(async (file) => {
          if (file.originFileObj) {
            // 为新上传的文件生成缩略图和预览
            const base64 = await getBase64(file.originFileObj);
            return {
              ...file,
              status: 'done' as const,
              url: base64,
              thumbUrl: await generateThumbnail(file.originFileObj)
            } as UploadFile;
          }
          return file;
        })
      );
      setFileList(processedFileList);
    },
    beforeUpload: async (file: File) => {
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        message.error('只能上传图片文件！');
        return false;
      }
      return true;
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
          stock: undefined,
          deliveryMethod: 'baiduDisk',
          deliveryInfo: ''
        }]
      });
    } else {
      form.setFieldsValue({
        specs: undefined,
        deliveryMethod: 'baiduDisk',
        deliveryInfo: '',
        stock: undefined
      });
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onSubmit}
      initialValues={initialValues}
    >
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-8">
          <Form.Item
            name="name"
            label="商品名称"
            rules={[{ required: true, message: '请输入商品名称' }]}
          >
            <Input placeholder="请输入商品名称" />
          </Form.Item>
        </div>
        <div className="col-span-4">
          <Form.Item
            name="category"
            label="商品分类"
            rules={[{ required: true, message: '请选择商品分类' }]}
          >
            <Select placeholder="请选择商品分类">
              {productSettings.categories.map(category => (
                <Select.Option key={category} value={category}>
                  {category}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-3">
          <Form.Item
            name="coverImage"
            label="商品头图"
            rules={[{ required: true, message: '请上传商品头图' }]}
          >
            <Upload
              name="coverImage"
              listType="picture-card"
              showUploadList={true}
              maxCount={1}
              fileList={coverImageList}
              beforeUpload={(file) => {
                const isImage = file.type.startsWith('image/');
                if (!isImage) {
                  message.error('只能上传图片文件！');
                  return false;
                }
                // 读取文件并更新表单值
                getBase64(file).then(url => {
                  const newFile: UploadFile = {
                    uid: '-1',
                    name: file.name,
                    status: 'done',
                    url: url,
                    type: file.type,
                    thumbUrl: url,
                    originFileObj: file
                  };
                  setCoverImageList([newFile]);
                  form.setFieldsValue({ coverImage: url });
                });
                return false;
              }}
              onChange={({ fileList }) => {
                setCoverImageList(fileList);
                if (fileList.length === 0) {
                  form.setFieldsValue({ coverImage: undefined });
                }
              }}
            >
              {!coverImageList.length && (
                <div className="flex flex-col items-center justify-center">
                  <PlusOutlined />
                  <div className="mt-2">上传头图</div>
                </div>
              )}
            </Upload>
          </Form.Item>
        </div>
      </div>

      {/* 公共图片上传 */}
      <Form.Item
        label={
          <Space>
            公共图片
            <Tooltip title="这些图片会同步到所有店铺，可以拖拽调整顺序，最多上传27张">
              <InfoCircleOutlined style={{ color: '#1890ff' }} />
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
              const isImage = file.type.startsWith('image/');
              if (!isImage) {
                message.error('只能上传图片文件！');
                return false;
              }
              return true;
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

      {/* 规格开关 */}
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
          <div className="grid grid-cols-2 gap-4">
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
              />
            </Form.Item>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <Form.Item
              name="deliveryMethod"
              label="��货方式"
              className="col-span-1"
            >
              <Select 
                placeholder="请选择发货方式"
                onChange={handleDeliveryMethodChange}
              >
                {deliveryMethods.map(method => (
                  <Select.Option key={method.value} value={method.value}>
                    {method.label}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="deliveryInfo"
              label="发货信息"
              className="col-span-3"
              rules={[
                { required: true, message: '请输入发货信息' },
                ...(deliveryInfoConfig[currentDeliveryMethod]?.rules || [])
              ]}
            >
              <Input.TextArea
                placeholder={deliveryInfoConfig[currentDeliveryMethod]?.placeholder || '请输入发货信息'}
                autoSize={{ minRows: 1, maxRows: 6 }}
              />
            </Form.Item>
          </div>
        </div>
      )}

      {/* 多规格信息 */}
      {hasSpecs && (
        <Form.List name="specs">
          {(fields, { add, remove }) => (
            <div className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.key} className="p-4 border rounded-lg bg-gray-50/50">
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-medium">规格 {index + 1}</span>
                    {fields.length > 1 && (
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => remove(field.name)}
                      />
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <Form.Item
                      {...field}
                      name={[field.name, 'name']}
                      label="规格名称"
                      rules={[{ required: true, message: '请输入规格名称' }]}
                    >
                      <Input placeholder="请输入规格名称" />
                    </Form.Item>

                    <Form.Item
                      {...field}
                      name={[field.name, 'price']}
                      label="售价(元)"
                      rules={[{ required: true, message: '请输入售价' }]}
                    >
                      <InputNumber
                        min={0}
                        placeholder="请输入售价"
                        style={{ width: '100%' }}
                      />
                    </Form.Item>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Form.Item
                      {...field}
                      name={[field.name, 'stock']}
                      label="库存(件)"
                      rules={[{ required: true, message: '请输入库存' }]}
                    >
                      <InputNumber
                        min={0}
                        placeholder="请输入库存"
                        style={{ width: '100%' }}
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
                      autoSize={{ minRows: 2, maxRows: 6 }}
                    />
                  </Form.Item>
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