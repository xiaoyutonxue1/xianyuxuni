import React, { useState, useEffect } from 'react';
import { Form, Input, Select, InputNumber, Button, Switch, Space, message, Upload, Tooltip, Progress, Modal } from 'antd';
import { InfoCircleFilled, PlusOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons';
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
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');
  const [fileList, setFileList] = useState<UploadFile[]>(
    initialValues.commonImages?.map(img => ({
      uid: img.id,
      url: img.url,
      thumbUrl: img.thumbUrl,
      name: img.id,
      status: 'done',
      size: img.size || 0,
      type: img.type
    })) || []
  );
  const [completeness, setCompleteness] = useState(calculateCompleteness(initialValues));
  const [missingFields, setMissingFields] = useState<string[]>(getMissingFields(initialValues));
  const [previewIndex, setPreviewIndex] = useState<number>(0);

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

  // 处理预览关闭
  const handlePreviewClose = () => {
    setPreviewOpen(false);
  };

  // 处理图片预览
  const handlePreview = async (file: UploadFile) => {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj as File);
    }
    const index = fileList.findIndex(item => item.uid === file.uid);
    setPreviewIndex(index);
    setPreviewImage(file.url || (file.preview as string));
    setPreviewOpen(true);
    setPreviewTitle(file.name || file.url!.substring(file.url!.lastIndexOf('/') + 1));
  };

  // 切换到上一张图片
  const handlePrevImage = () => {
    const newIndex = (previewIndex - 1 + fileList.length) % fileList.length;
    setPreviewIndex(newIndex);
    const file = fileList[newIndex];
    setPreviewImage(file.url || (file.preview as string));
    setPreviewTitle(file.name || file.url!.substring(file.url!.lastIndexOf('/') + 1));
  };

  // 切换到下一张图片
  const handleNextImage = () => {
    const newIndex = (previewIndex + 1) % fileList.length;
    setPreviewIndex(newIndex);
    const file = fileList[newIndex];
    setPreviewImage(file.url || (file.preview as string));
    setPreviewTitle(file.name || file.url!.substring(file.url!.lastIndexOf('/') + 1));
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
    onPreview: handlePreview,
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
        commonImages: await Promise.all(fileList.map(async (file) => ({
          id: file.uid,
          url: file.originFileObj ? await getBase64(file.originFileObj) : (file.url || ''),
          thumbUrl: file.thumbUrl || '',
          type: 'common' as const,
          sort: fileList.indexOf(file),
          createdAt: new Date().toISOString(),
          size: file.size
        })))
      };

      await onSubmit(submitData);
    } catch (error) {
      message.error('更新失败');
    }
  };

  return (
    <>
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

      <Modal
        open={previewOpen}
        title={`${previewTitle} (${previewIndex + 1}/${fileList.length})`}
        footer={null}
        onCancel={handlePreviewClose}
        width="90%"
        style={{ maxWidth: '1400px', top: 20 }}
        centered
        bodyStyle={{ padding: '24px 0' }}
      >
        <div className="relative" style={{ minHeight: '400px', backgroundColor: 'rgba(0,0,0,0.02)' }}>
          {fileList.length > 1 && (
            <>
              <Button
                className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 hover:bg-gray-700/60"
                type="text"
                icon={<LeftOutlined style={{ fontSize: '24px' }} />}
                onClick={handlePrevImage}
                style={{ 
                  background: 'rgba(0,0,0,0.3)', 
                  color: '#fff',
                  border: 'none',
                  height: '80px',
                  width: '50px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.3s'
                }}
              />
              <Button
                className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 hover:bg-gray-700/60"
                type="text"
                icon={<RightOutlined style={{ fontSize: '24px' }} />}
                onClick={handleNextImage}
                style={{ 
                  background: 'rgba(0,0,0,0.3)', 
                  color: '#fff',
                  border: 'none',
                  height: '80px',
                  width: '50px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.3s'
                }}
              />
            </>
          )}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            padding: '0 60px',
            minHeight: '400px',
            maxHeight: '80vh',
            overflow: 'hidden'
          }}>
            <img
              alt="预览图片"
              src={previewImage}
              style={{ 
                maxWidth: '100%',
                maxHeight: '80vh',
                objectFit: 'contain'
              }}
            />
          </div>
        </div>
      </Modal>
    </>
  );
};

export default EditProductForm; 