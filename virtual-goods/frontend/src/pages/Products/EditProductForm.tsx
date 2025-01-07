import React, { useState, useEffect } from 'react';
import { Form, Input, Select, InputNumber, Button, Switch, Space, message, Upload, Tooltip, Modal } from 'antd';
import { InfoCircleFilled, PlusOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import type { Product } from '../../types/product';
import { categoryOptions, deliveryMethods } from '../../utils/constants';
import useSettingsStore from '../../store/settingsStore';

interface EditProductFormProps {
  initialValues: Product;
  onSubmit: (values: any) => Promise<void>;
  onCancel: () => void;
}

const EditProductForm: React.FC<EditProductFormProps> = ({
  initialValues,
  onSubmit,
  onCancel,
}) => {
  console.log('EditProductForm rendered with initialValues:', initialValues);

  const [form] = Form.useForm();
  const [hasSpecs, setHasSpecs] = useState(initialValues.hasSpecs);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');
  const [fileList, setFileList] = useState<UploadFile[]>(
    initialValues.commonImages?.map((img: any) => ({
      uid: img.id,
      url: img.url,
      thumbUrl: img.thumbUrl,
      name: img.id,
      status: 'done',
      size: img.size || 0,
      type: 'common'
    })) || []
  );
  const [previewIndex, setPreviewIndex] = useState<number>(0);
  const [coverImageUrl, setCoverImageUrl] = useState<string>(initialValues.coverImage || '');
  const [coverImageLoading, setCoverImageLoading] = useState(false);
  const [coverImageList, setCoverImageList] = useState<UploadFile[]>(
    initialValues.coverImage ? [{
      uid: '-1',
      name: 'cover-image',
      status: 'done',
      url: initialValues.coverImage,
      type: 'image/jpeg',
      thumbUrl: initialValues.coverImage
    }] : []
  );

  const { productSettings } = useSettingsStore();

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

  // 添加发货方式状态
  const [currentDeliveryMethod, setCurrentDeliveryMethod] = useState<string>(
    initialValues?.deliveryMethod || 'baiduDisk'
  );

  // 监听表单初始化
  useEffect(() => {
    console.log('Form initialized with values:', initialValues);
  }, [initialValues, form]);

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

  // 处理头图上传前的预览
  const handleCoverImagePreview = async (file: File) => {
    try {
      const reader = new FileReader();
      reader.onload = () => {
        setCoverImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
      return false; // 阻止自动上传
    } catch (error) {
      console.error('Error previewing cover image:', error);
      return false;
    }
  };

  // 处理头图变化
  const handleCoverImageChange = (info: any) => {
    if (info.file.status === 'uploading') {
      setCoverImageLoading(true);
      return;
    }
    if (info.file.status === 'done') {
      setCoverImageLoading(false);
    }
  };

  // 处理发货方式变化
  const handleDeliveryMethodChange = (value: string) => {
    setCurrentDeliveryMethod(value);
    // 清空发货信息
    form.setFieldValue('deliveryInfo', '');
  };

  // 处理表单提交
  const handleSubmit = async (values: any) => {
    try {
      // 添加公共图片数据
      const submitData = {
        ...values,
        // 处理头图
        coverImage: coverImageList[0]?.originFileObj ? 
          await getBase64(coverImageList[0].originFileObj) : 
          coverImageList[0]?.url || '',
        // 保留商品标题和文案
        distributedTitle: values.distributedTitle?.trim(),
        distributedContent: values.distributedContent?.trim(),
        // 处理公共图片
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
        initialValues={{
          ...initialValues,
          coverImage: initialValues.coverImage ? [{
            uid: '-1',
            name: 'cover-image',
            status: 'done',
            url: initialValues.coverImage,
            type: 'image/jpeg',
            thumbUrl: initialValues.coverImage
          }] : []
        }}
        onFinish={handleSubmit}
      >
        <div className="mb-4">
          <span className="text-lg font-medium">编辑商品</span>
        </div>

        {/* 第一行：商品名称、商品标题、商品分类 */}
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-3">
            <Form.Item
              name="name"
              label="商品名称"
              rules={[{ required: true, message: '请输入商品名称' }]}
            >
              <Input placeholder="请输入商品名称" />
            </Form.Item>
          </div>
          
          <div className="col-span-6">
            <Form.Item
              name="distributedTitle"
              label="商品标题"
              rules={[
                { required: true, message: '请输入商品标题' },
                { max: 30, message: '标题不能超过30个字符' }
              ]}
            >
              <Input.TextArea
                placeholder="请输入商品标题"
                showCount
                maxLength={30}
                autoSize={{ minRows: 2, maxRows: 6 }}
              />
            </Form.Item>
          </div>
          
          <div className="col-span-3">
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
          </div>
        </div>

        {/* 第二行：商品头图和商品文案 */}
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
                className="upload-list-inline"
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
                onPreview={async (file) => {
                  if (!file.url && !file.preview) {
                    file.preview = await getBase64(file.originFileObj as File);
                  }
                  setPreviewImage(file.url || file.preview as string);
                  setPreviewOpen(true);
                  setPreviewTitle(file.name || file.url!.substring(file.url!.lastIndexOf('/') + 1));
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
          
          <div className="col-span-7">
            <Form.Item
              name="distributedContent"
              label="商品文案"
              rules={[{ required: true, message: '请输入商品文案' }]}
            >
              <Input.TextArea
                placeholder="请输入商品文案"
                rows={4}
                style={{ height: '104px', resize: 'none' }}
              />
            </Form.Item>
          </div>

          <div className="col-span-2">
            <Form.Item
              name="status"
              label="状态"
            >
              <Select style={{ width: '100%' }}>
                <Select.Option value="draft">草稿</Select.Option>
                <Select.Option value="pending">待发布</Select.Option>
                <Select.Option value="published">已发布</Select.Option>
                <Select.Option value="failed">发布失败</Select.Option>
                <Select.Option value="offline">已下架</Select.Option>
              </Select>
            </Form.Item>
          </div>
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
          <div className="flex justify-center">
            <img
              alt={previewTitle}
              src={previewImage}
              style={{ maxWidth: '100%', maxHeight: 'calc(100vh - 200px)' }}
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

export default EditProductForm; 