import React, { useState, useEffect } from 'react';
import { Form, Input, Select, InputNumber, Button, Switch, Space, message, Upload, Tooltip, Progress, Modal } from 'antd';
import { InfoCircleFilled, PlusOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import useSettingsStore from '../../store/settingsStore';
import { deliveryMethods } from '../../utils/constants';
import { calculateCompleteness, getMissingFields } from '../../utils/productCompleteness';
import type { ProductSelection } from '../../types/product';

interface CreateProductFormProps {
  onSubmit: (values: any) => Promise<void>;
  onCancel: () => void;
  mode?: 'create' | 'edit';
  initialValues?: ProductSelection;
}

// 添加发货方式对应的提示和验证规则
const deliveryInfoConfig: Record<string, { placeholder: string; rules: any[] }> = {
  baiduDisk: {
    placeholder: '请输入百度网盘链接，格式：链接 提取码',
    rules: []
  },
  baiduDiskGroup: {
    placeholder: '请输入百度网盘群链接，格式：群链接',
    rules: []
  },
  baiduDiskGroupCode: {
    placeholder: '请输入百度网盘群口令',
    rules: []
  },
  quarkDisk: {
    placeholder: '请输入夸克网盘链接，格式：链接 提取码',
    rules: []
  },
  quarkDiskGroup: {
    placeholder: '请输入夸克网盘群链接',
    rules: []
  }
} as const;

const CreateProductForm: React.FC<CreateProductFormProps> = ({
  onSubmit,
  onCancel,
  mode = 'create',
  initialValues,
}) => {
  const [form] = Form.useForm();
  const [hasSpecs, setHasSpecs] = useState(initialValues?.hasSpecs || false);
  const [createMode, setCreateMode] = useState<'manual' | 'crawler'>(initialValues?.source || 'manual');
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
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');
  const [previewIndex, setPreviewIndex] = useState<number>(0);
  const [completeness, setCompleteness] = useState(calculateCompleteness(initialValues || {} as ProductSelection));
  const [missingFields, setMissingFields] = useState<string[]>(getMissingFields(initialValues || {} as ProductSelection));

  const { productSettings } = useSettingsStore();

  // 添加发货方式状态
  const [currentDeliveryMethod, setCurrentDeliveryMethod] = useState<string>(
    initialValues?.deliveryMethod || 'baiduDisk'
  );

  // 处理发货方式变化
  const handleDeliveryMethodChange = (value: string) => {
    setCurrentDeliveryMethod(value);
    // 清空发货信息
    form.setFieldValue('deliveryInfo', '');
  };

  // 初始化表单数据
  useEffect(() => {
    if (initialValues && mode === 'edit') {
      form.setFieldsValue({
        ...initialValues,
        method: initialValues.source,
      });
      setHasSpecs(initialValues.hasSpecs || false);
      setCreateMode(initialValues.source || 'manual');
      updateCompleteness();
    }
  }, [initialValues, form, mode]);

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

  // 处理图片拖拽排序
  const moveImage = (dragIndex: number, hoverIndex: number) => {
    const dragItem = fileList[dragIndex];
    const newFileList = [...fileList];
    newFileList.splice(dragIndex, 1);
    newFileList.splice(hoverIndex, 0, dragItem);
    setFileList(newFileList);
    updateCompleteness();
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
      updateCompleteness();
    },
    onPreview: handlePreview,
    beforeUpload: async (file: File) => {
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        message.error('只能上传图片文件！');
        return false;
      }
      return true;
    },
    itemRender: (originNode: React.ReactElement, file: UploadFile, fileList: UploadFile[], actions: { download: () => void; preview: () => void; remove: () => void }) => {
      const index = fileList.indexOf(file);
      return (
        <div
          draggable
          onDragStart={(e) => {
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', index.toString());
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
          }}
          onDrop={(e) => {
            e.preventDefault();
            const dragIndex = parseInt(e.dataTransfer.getData('text/plain'));
            const hoverIndex = index;
            if (dragIndex === hoverIndex) return;
            moveImage(dragIndex, hoverIndex);
          }}
          style={{ cursor: 'move' }}
        >
          {originNode}
        </div>
      );
    }
  };

  // 更新完整度
  const updateCompleteness = () => {
    const values = form.getFieldsValue();
    const currentData = {
      ...values,
      source: createMode,
      method: createMode,
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

  // 处理表单提交
  const handleSubmit = async (values: any) => {
    try {
      // 添加公共图片数据
      const submitData = {
        ...values,
        source: createMode,
        method: createMode,
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

      console.log('Form submit data:', submitData);
      await onSubmit(submitData);
    } catch (error) {
      message.error('创建失败');
    }
  };

  // 处理创建模式切换
  const handleModeChange = (mode: 'manual' | 'crawler') => {
    console.log('Mode changed to:', mode);
    setCreateMode(mode);
    form.setFieldsValue({ 
      source: mode,
      method: mode 
    });
    updateCompleteness();
  };

  return (
    <>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        onValuesChange={handleFormChange}
        initialValues={{
          source: 'manual',
          method: 'manual',
          hasSpecs: false,
          ...initialValues,
        }}
      >
        <div className="mb-4 flex justify-between items-center">
          <span className="text-lg font-medium">{mode === 'create' ? '新增选品' : '编辑选品'}</span>
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

        {/* 创建模式选择 */}
        {mode === 'create' && (
          <div className="mb-4">
            <div className="text-sm text-gray-500 mb-2">创建模式</div>
            <Space>
              <Button
                type={createMode === 'manual' ? 'primary' : 'default'}
                onClick={() => handleModeChange('manual')}
              >
                手动创建
              </Button>
              <Button
                type={createMode === 'crawler' ? 'primary' : 'default'}
                onClick={() => handleModeChange('crawler')}
              >
                爬虫抓取
              </Button>
            </Space>
          </div>
        )}

        {createMode === 'manual' ? (
          <>
            {/* 商品名称和分类放在同一行 */}
            <div className="grid grid-cols-2 gap-4">
              <Form.Item
                name="name"
                label="商品名称"
                rules={[{ required: true, message: '请输入商品名称' }]}
              >
                <Input placeholder="请输入商品名称" />
              </Form.Item>

              <Form.Item
                name="category"
                label="选品分类"
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
            </div>

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
                  className="upload-list-inline"
                  maxCount={27}
                  listType="picture-card"
                  showUploadList={{
                    showPreviewIcon: true,
                    showRemoveIcon: true,
                    showDownloadIcon: false
                  }}
                  style={{
                    '--upload-item-margin': '8px',
                    '--upload-item-hover-border': '1px solid #1890ff'
                  } as React.CSSProperties}
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
                    label="发货方式"
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
                    label={
                      <Space>
                        发货信息
                        <Tooltip title={deliveryInfoConfig[currentDeliveryMethod as keyof typeof deliveryInfoConfig]?.placeholder}>
                          <InfoCircleFilled style={{ color: '#1890ff' }} />
                        </Tooltip>
                      </Space>
                    }
                    rules={deliveryInfoConfig[currentDeliveryMethod as keyof typeof deliveryInfoConfig]?.rules}
                    className="col-span-3"
                  >
                    <Input.TextArea
                      placeholder={deliveryInfoConfig[currentDeliveryMethod as keyof typeof deliveryInfoConfig]?.placeholder}
                      rows={3}
                    />
                  </Form.Item>
                </div>
              </div>
            )}

            {/* 多规格表单 */}
            {hasSpecs && (
              <Form.List name="specs"
                initialValue={[{ 
                  name: '默认规格',
                  stock: undefined,
                  deliveryMethod: 'baiduDisk',
                  deliveryInfo: ''
                }]}
              >
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

                          <div className="grid grid-cols-2 gap-4">
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
                              />
                            </Form.Item>
                          </div>

                          <div className="grid grid-cols-4 gap-4">
                            <Form.Item
                              {...field}
                              name={[field.name, 'deliveryMethod']}
                              label="发货方式"
                              className="col-span-1"
                            >
                              <Select 
                                placeholder="请选择发货方式"
                                onChange={(value) => {
                                  const specs = form.getFieldValue('specs');
                                  specs[index].deliveryInfo = '';
                                  form.setFieldsValue({ specs });
                                }}
                              >
                                {deliveryMethods.map(method => (
                                  <Select.Option key={method.value} value={method.value}>
                                    {method.label}
                                  </Select.Option>
                                ))}
                              </Select>
                            </Form.Item>

                            <Form.Item
                              {...field}
                              name={[field.name, 'deliveryInfo']}
                              label={
                                <Space>
                                  发货信息
                                  <Tooltip title={
                                    deliveryInfoConfig[
                                      form.getFieldValue(['specs', index, 'deliveryMethod']) || 'baiduDisk'
                                    ]?.placeholder
                                  }>
                                    <InfoCircleFilled style={{ color: '#1890ff' }} />
                                  </Tooltip>
                                </Space>
                              }
                              rules={
                                deliveryInfoConfig[
                                  form.getFieldValue(['specs', index, 'deliveryMethod']) || 'baiduDisk'
                                ]?.rules
                              }
                              className="col-span-3"
                            >
                              <Input.TextArea
                                placeholder={
                                  deliveryInfoConfig[
                                    form.getFieldValue(['specs', index, 'deliveryMethod']) || 'baiduDisk'
                                  ]?.placeholder
                                }
                                rows={3}
                              />
                            </Form.Item>
                          </div>
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
        ) : (
          <Form.Item
            name="productUrl"
            label="商品链接"
            rules={[{ required: true, message: '请输入商品链接' }]}
          >
            <Input.TextArea
              placeholder="请输入商品链接"
              rows={4}
            />
          </Form.Item>
        )}

        <div className="flex justify-end mt-6 space-x-2">
          <Button onClick={onCancel}>
            取消
          </Button>
          <Button type="primary" htmlType="submit">
            {mode === 'create' ? '新增选品' : '确定'}
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
        bodyStyle={{ 
          padding: '24px 0'
        }}
      >
        <div className="relative" style={{ minHeight: '400px', backgroundColor: 'rgba(0,0,0,0.02)' }}>
          {fileList.length > 1 && (
            <>
              <Button
                className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10"
                type="primary"
                size="large"
                icon={<LeftOutlined style={{ fontSize: '24px' }} />}
                onClick={handlePrevImage}
                style={{ 
                  height: '80px',
                  width: '50px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: 0.9
                }}
              />
              <Button
                className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10"
                type="primary"
                size="large"
                icon={<RightOutlined style={{ fontSize: '24px' }} />}
                onClick={handleNextImage}
                style={{ 
                  height: '80px',
                  width: '50px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: 0.9
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

      <style>{`
        .ant-form-item {
          margin-bottom: 24px;
        }
        .ant-form-item-label {
          font-weight: 500;
        }
        .ant-upload-list-picture-card .ant-upload-list-item {
          padding: 0;
        }
        .ant-upload-list-picture-card .ant-upload-list-item-info {
          height: 100%;
        }
        .ant-upload-list-picture-card .ant-upload-list-item-thumbnail {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .ant-upload-list-picture-card .ant-upload-list-item-actions {
          right: 8px;
          top: 8px;
        }
      `}</style>
    </>
  );
};

export default CreateProductForm; 