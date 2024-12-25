import React, { useState, useEffect } from 'react';
import { Card, Tabs, Form, Input, Button, Select, InputNumber, Switch, Space, Tag, message, Modal, Table, Divider, Slider } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons';
import useSettingsStore from '../../store/settingsStore';
import type { StoreGroup, StoreAccount, DeliveryMethodSetting, ProductTemplate } from '../../store/settingsStore';
import { v4 as uuidv4 } from 'uuid';
import type { FormInstance } from 'antd';

const { TabPane } = Tabs;

// 定义可用的占位符
const placeholders = {
  title: '标题',
  description: '描述',
  category: '分类',
  price: '价格',
  stock: '库存',
  deliveryMethod: '发货方式',
  deliveryInfo: '发货信息',
  sourceUrl: '来源链接',
  sourceStatus: '来源状态',
  sourceType: '来源类型',
  remark: '备注',
};

// 商品模板表单
const TemplateForm: React.FC<{
  initialValues?: ProductTemplate;
  onSubmit: (values: ProductTemplate) => void;
  onCancel: () => void;
}> = ({ initialValues, onSubmit, onCancel }) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue(initialValues);
    }
  }, [initialValues, form]);

  // 处理插入占位符
  const handleInsertPlaceholder = (field: string, placeholder: string) => {
    const currentValue = form.getFieldValue(field) || '';
    const textarea = document.getElementById(`template_${field}`) as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart || 0;
    const end = textarea.selectionEnd || 0;
    const newValue = currentValue.substring(0, start) + `{${placeholder}}` + currentValue.substring(end);
    
    // 更新表单值
    form.setFieldsValue({
      [field]: newValue
    });

    // 设置新的光标位置
    setTimeout(() => {
      const newCursorPos = start + placeholder.length + 2; // 加2是因为{}的长度
      textarea.setSelectionRange(newCursorPos, newCursorPos);
      textarea.focus();
    }, 0);
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onSubmit}
      initialValues={initialValues}
    >
      <Form.Item
        name="name"
        label="模板名称"
        rules={[{ required: true, message: '请输入模板名称' }]}
      >
        <Input placeholder="请输入模板名称" />
      </Form.Item>

      <div className="mb-4">
        <div className="flex flex-wrap gap-2 mb-2">
          <span>可用占位符：</span>
          {Object.entries(placeholders).map(([key, label]) => (
            <Tag
              key={key}
              color="blue"
              className="cursor-pointer"
              onClick={() => handleInsertPlaceholder('title', key)}
            >
              {label}
            </Tag>
          ))}
        </div>
      </div>

      <Form.Item
        name="title"
        label="标题模板"
        rules={[{ required: true, message: '请输入标题模板' }]}
      >
        <Input.TextArea
          id="template_title"
          placeholder="例如：【正版资源】{title}"
          rows={2}
        />
      </Form.Item>

      <div className="mb-4">
        <div className="flex flex-wrap gap-2 mb-2">
          <span>可用占位符：</span>
          {Object.entries(placeholders).map(([key, label]) => (
            <Tag
              key={key}
              color="blue"
              className="cursor-pointer"
              onClick={() => handleInsertPlaceholder('description', key)}
            >
              {label}
            </Tag>
          ))}
        </div>
      </div>

      <Form.Item
        name="description"
        label="文案模板"
        rules={[{ required: true, message: '请输入文案模板' }]}
      >
        <Input.TextArea
          id="template_description"
          placeholder="例如：✨ {description}&#10;&#10;💫 发货方式：{deliveryMethod}&#10;🌟 售后服务：终身有效"
          rows={6}
        />
      </Form.Item>

      <Form.Item name="isDefault" valuePropName="checked">
        <Switch checkedChildren="默认模板" unCheckedChildren="普通模板" />
      </Form.Item>

      <Form.Item className="mb-0 text-right">
        <Space>
          <Button onClick={onCancel}>
            取消
          </Button>
          <Button type="primary" htmlType="submit">
            确定
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
};

// 商品模板列表
const TemplateList: React.FC<{
  templates: ProductTemplate[];
  onEdit: (template: ProductTemplate) => void;
  onDelete: (templateId: string) => void;
  onSetDefault: (templateId: string) => void;
}> = ({ templates, onEdit, onDelete, onSetDefault }) => {
  return (
    <div className="space-y-4">
      {templates.map(template => (
        <Card
          key={template.id}
          size="small"
          title={
            <Space>
              {template.name}
              {template.isDefault && <Tag color="blue">默认</Tag>}
            </Space>
          }
          extra={
            <Space>
              {!template.isDefault && (
                <Button
                  type="link"
                  size="small"
                  onClick={() => onSetDefault(template.id)}
                >
                  设为默认
                </Button>
              )}
              <Button
                type="link"
                size="small"
                onClick={() => onEdit(template)}
              >
                编辑
              </Button>
              <Button
                type="link"
                danger
                size="small"
                onClick={() => onDelete(template.id)}
              >
                删除
              </Button>
            </Space>
          }
        >
          <div className="space-y-2">
            <div>
              <div className="text-gray-500 mb-1">标题模板：</div>
              <div className="bg-gray-50 p-2 rounded">{template.title}</div>
            </div>
            <div>
              <div className="text-gray-500 mb-1">文案模板：</div>
              <div className="bg-gray-50 p-2 rounded whitespace-pre-wrap">{template.description}</div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

// 店铺
const StoreForm: React.FC<{
  form: FormInstance;
  initialValues?: StoreAccount;
  onSubmit: (values: any) => void;
  onCancel: () => void;
}> = ({ form, initialValues, onSubmit, onCancel }) => {
  const [isTemplateModalVisible, setIsTemplateModalVisible] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<ProductTemplate | undefined>();
  const [templates, setTemplates] = useState<ProductTemplate[]>(
    initialValues?.features?.templates || []
  );
  // 添加预览图片状态
  const [previewImages, setPreviewImages] = useState<Array<{id: string; url: string}>>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (form && initialValues) {
      form.setFieldsValue({
        ...initialValues,
        watermarkSettings: initialValues.features?.watermarkSettings || {
          fontSize: 20,
          opacity: 15,
          position: 'center',
          rotation: 0,
          mode: 'single',
          color: '#000000',
          useSmartColor: false,
          useRegionAnalysis: false,
          useContrastAnalysis: false
        }
      });
      setTemplates(initialValues.features?.templates || []);
    }
  }, [form, initialValues]);

  // 初始化水印预览
  useEffect(() => {
    const canvas = document.getElementById('watermarkPreview') as HTMLCanvasElement;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // 清空画布
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // 绘制背景
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // 添加水印
        const watermarkText = initialValues?.watermarkText;
        if (watermarkText) {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
          ctx.font = '20px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(watermarkText, canvas.width / 2, canvas.height / 2);
        }
      }
    }
  }, [initialValues?.watermarkText]);

  const handleSubmit = (values: any) => {
    onSubmit({
      ...values,
      features: {
        ...values.features,
        templates,
        watermarkSettings: values.watermarkSettings // 包含水印设置
      }
    });
  };

  const handleTemplateSubmit = (values: ProductTemplate) => {
    let newTemplates: ProductTemplate[];
    const newTemplate = {
      ...values,
      id: currentTemplate?.id || uuidv4()
    };
    
    if (currentTemplate) {
      // 编辑现有模板
      newTemplates = templates.map(t => 
        t.id === currentTemplate.id ? newTemplate : t
      );
    } else {
      // 添加新模板
      newTemplates = [...templates, newTemplate];
    }

    // 如果设置了新的默认模板，需要取消其他模板的默认状态
    if (values.isDefault) {
      newTemplates = newTemplates.map(t => ({
        ...t,
        isDefault: t.id === newTemplate.id
      }));
    }

    setTemplates(newTemplates);
    setIsTemplateModalVisible(false);
    setCurrentTemplate(undefined);
  };

  const handleDeleteTemplate = (templateId: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个模板吗？删除后无法恢复。',
      onOk: () => {
        setTemplates(templates.filter(t => t.id !== templateId));
      }
    });
  };

  const handleSetDefaultTemplate = (templateId: string) => {
    setTemplates(templates.map(t => ({
      ...t,
      isDefault: t.id === templateId
    })));
  };

  // 修改图片上传处理函数
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          setPreviewImages(prev => {
            const newImages = [...prev, {
              id: uuidv4(),
              url: event.target?.result as string
            }];
            // 如果是第一张图片，更新预览
            if (prev.length === 0) {
              updateWatermarkPreview();
            }
            return newImages;
          });
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    });

    // 清除input的value允许重新上传
    e.target.value = '';
  };

  // 修改图片切换函数
  const handleSwitchImage = (direction: 'prev' | 'next') => {
    if (previewImages.length <= 1) return;
    
    let newIndex;
    if (direction === 'prev') {
      newIndex = currentImageIndex > 0 ? currentImageIndex - 1 : previewImages.length - 1;
    } else {
      newIndex = currentImageIndex < previewImages.length - 1 ? currentImageIndex + 1 : 0;
    }
    setCurrentImageIndex(newIndex);
    // 使用setTimeout确保状态更新后再更新预览
    setTimeout(() => updateWatermarkPreview(), 0);
  };

  // 修改清除图片函数
  const handleClearImage = () => {
    // 清除所有图片相关状态
    setPreviewImages([]);
    setCurrentImageIndex(0);
    // 清除canvas
    const canvas = document.getElementById('watermarkPreview') as HTMLCanvasElement;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
    message.success('已清除所有预览图片');
  };

  // 添加删除单张图片的函数
  const handleDeleteImage = (index: number) => {
    setPreviewImages(prev => {
      const newImages = prev.filter((_, i) => i !== index);
      // 如果删除的是当前显示的图片，需要调整currentImageIndex
      if (index === currentImageIndex) {
        // 如果删除的是最后一张图片，显示新的最后一张
        if (index >= newImages.length) {
          setCurrentImageIndex(Math.max(0, newImages.length - 1));
        }
        // 否则保持当前索引，显示下一张图片
      } else if (index < currentImageIndex) {
        // 如果删除的图片在当前图片之前，需要将索引减1
        setCurrentImageIndex(currentImageIndex - 1);
      }
      // 如果还有图片，更新预览
      if (newImages.length > 0) {
        setTimeout(() => updateWatermarkPreview(), 0);
      } else {
        handleClearImage();
      }
      return newImages;
    });
  };

  // 基础亮度分析
  const analyzeBasicBrightness = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    let totalBrightness = 0;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const brightness = (0.299 * r + 0.587 * g + 0.114 * b);
      totalBrightness += brightness;
    }

    const averageBrightness = totalBrightness / (data.length / 4);
    console.log('Average brightness:', averageBrightness);
    
    // 根据亮度返回对比度更高的颜色
    if (averageBrightness > 128) {
      return 'rgba(0, 0, 0, 0.8)';
    } else {
      return 'rgba(255, 255, 255, 0.8)';
    }
  };

  // 区域亮度分析
  const analyzeRegionBrightness = (
    ctx: CanvasRenderingContext2D, 
    width: number, 
    height: number, 
    position: string,
    fontSize: number
  ) => {
    // 分析区域大小为字体大小的4倍
    const regionSize = fontSize * 4;
    let startX = 0, startY = 0;

    // 根据位置确定分析区域
    switch (position) {
      case 'top-left':
        startX = 0;
        startY = 0;
        break;
      case 'top-right':
        startX = width - regionSize;
        startY = 0;
        break;
      case 'bottom-left':
        startX = 0;
        startY = height - regionSize;
        break;
      case 'bottom-right':
        startX = width - regionSize;
        startY = height - regionSize;
        break;
      default: // center
        startX = (width - regionSize) / 2;
        startY = (height - regionSize) / 2;
    }

    // 确保坐标在有效范围内
    startX = Math.max(0, Math.min(startX, width - regionSize));
    startY = Math.max(0, Math.min(startY, height - regionSize));

    const imageData = ctx.getImageData(startX, startY, regionSize, regionSize);
    const data = imageData.data;
    let totalBrightness = 0;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const brightness = (0.299 * r + 0.587 * g + 0.114 * b);
      totalBrightness += brightness;
    }

    const averageBrightness = totalBrightness / (data.length / 4);
    console.log('Region brightness:', averageBrightness);

    // 根据区域亮度返回对比度更高的颜色
    if (averageBrightness > 128) {
      return 'rgba(0, 0, 0, 0.8)';
    } else {
      return 'rgba(255, 255, 255, 0.8)';
    }
  };

  // 对比度分析
  const analyzeColorContrast = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    let maxBrightness = 0;
    let minBrightness = 255;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const brightness = (0.299 * r + 0.587 * g + 0.114 * b);
      maxBrightness = Math.max(maxBrightness, brightness);
      minBrightness = Math.min(minBrightness, brightness);
    }

    const contrast = maxBrightness - minBrightness;
    console.log('Color contrast:', contrast);

    // 根据对比度选择合适的颜色
    if (contrast < 64) {
      // 低对比度图片，使用半透明黑色
      return 'rgba(0, 0, 0, 0.9)';
    } else {
      // 高对比度图片，根据平均亮度选择颜色
      const averageBrightness = (maxBrightness + minBrightness) / 2;
      if (averageBrightness > 128) {
        return 'rgba(0, 0, 0, 0.8)';
      } else {
        return 'rgba(255, 255, 255, 0.8)';
      }
    }
  };

  // 修改智能水印开关的处理
  const handleSmartWatermarkChange = (type: 'useSmartColor' | 'useRegionAnalysis' | 'useContrastAnalysis', checked: boolean) => {
    // 更新表单值
    const values = form.getFieldsValue();
    const newSettings = {
      ...values.watermarkSettings,
      [type]: checked
    };
    
    // 如果关闭智能水印，同时关闭其他分析
    if (type === 'useSmartColor' && !checked) {
      newSettings.useRegionAnalysis = false;
      newSettings.useContrastAnalysis = false;
    }
    
    // 如果开启其他分析，确保智能水印开启
    if ((type === 'useRegionAnalysis' || type === 'useContrastAnalysis') && checked) {
      newSettings.useSmartColor = true;
    }
    
    form.setFieldsValue({
      watermarkSettings: newSettings
    });
    
    // 直接更新预览，不改变当前图片索引
    updateWatermarkPreview();
  };

  // 更新水印预览
  const updateWatermarkPreview = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 如果有背景图片，绘制背景图片
    if (previewImage) {
      ctx.drawImage(previewImage, 0, 0, canvas.width, canvas.height);
    } else {
      // 绘制灰色背景
      ctx.fillStyle = '#f0f0f0';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    const watermarkText = form.getFieldValue('watermarkText');
    if (!watermarkText) return;

    // 获取水印设置
    const settings = {
      fontSize: form.getFieldValue('watermarkSettings.fontSize') || 20,
      opacity: (form.getFieldValue('watermarkSettings.opacity') || 15) / 100,
      position: form.getFieldValue('watermarkSettings.position') || 'center',
      rotation: (form.getFieldValue('watermarkSettings.rotation') || 0) * Math.PI / 180,
      mode: form.getFieldValue('watermarkSettings.mode') || 'single',
      useSmartColor: form.getFieldValue('watermarkSettings.useSmartColor') || false,
      useRegionAnalysis: form.getFieldValue('watermarkSettings.useRegionAnalysis') || false,
      useContrastAnalysis: form.getFieldValue('watermarkSettings.useContrastAnalysis') || false,
      color: form.getFieldValue('watermarkSettings.color') || '#000000'
    };

    // 设置水印样式
    ctx.save();
    ctx.font = `${settings.fontSize}px Arial`;
    
    // 根据智能水印设置选择颜色
    let watermarkColor;
    if (settings.useSmartColor) {
      if (settings.useContrastAnalysis) {
        watermarkColor = analyzeColorContrast(ctx, canvas.width, canvas.height);
      } else if (settings.useRegionAnalysis) {
        watermarkColor = analyzeRegionBrightness(ctx, canvas.width, canvas.height, settings.position, settings.fontSize);
      } else {
        watermarkColor = analyzeBasicBrightness(ctx, canvas.width, canvas.height);
      }
    } else {
      watermarkColor = settings.color;
    }

    ctx.fillStyle = watermarkColor;
    ctx.globalAlpha = settings.opacity;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (settings.mode === 'single') {
      // 计算位置
      let x = canvas.width / 2;
      let y = canvas.height / 2;
      
      switch (settings.position) {
        case 'top-left':
          x = settings.fontSize * 2;
          y = settings.fontSize;
          break;
        case 'top-right':
          x = canvas.width - settings.fontSize * 2;
          y = settings.fontSize;
          break;
        case 'bottom-left':
          x = settings.fontSize * 2;
          y = canvas.height - settings.fontSize;
          break;
        case 'bottom-right':
          x = canvas.width - settings.fontSize * 2;
          y = canvas.height - settings.fontSize;
          break;
      }

      // 应用旋转
      ctx.translate(x, y);
      ctx.rotate(settings.rotation);
      ctx.fillText(watermarkText, 0, 0);
    } else {
      // 平铺模式
      const textWidth = ctx.measureText(watermarkText).width;
      const gap = textWidth + settings.fontSize;
      
      for (let y = settings.fontSize; y < canvas.height; y += gap) {
        for (let x = settings.fontSize * 2; x < canvas.width; x += gap) {
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(settings.rotation);
          ctx.fillText(watermarkText, 0, 0);
          ctx.restore();
        }
      }
    }
    ctx.restore();
  };

  return (
    <div className="space-y-4">
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={initialValues}
        onValuesChange={() => {
          // 当表单值变化时更新预览
          updateWatermarkPreview();
        }}
      >
        {/* 基础信息 */}
        <Card title="基础信息" className="shadow-sm">
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="name"
              label="店铺名称"
              rules={[{ required: true, message: '请输入店铺名称' }]}
            >
              <Input placeholder="请输入店铺名称" />
            </Form.Item>

            <Form.Item
              name="platform"
              label="所属平台"
              rules={[{ required: true, message: '请选择所属平台' }]}
            >
              <Select>
                <Select.Option value="闲鱼">闲鱼</Select.Option>
                <Select.Option value="淘宝">淘宝</Select.Option>
              </Select>
            </Form.Item>
          </div>
        </Card>

        {/* 水印设置 */}
        <Card title="水印设置" className="shadow-sm">
          <div className="space-y-4">
            {/* 基础设置 */}
            <div className="grid grid-cols-4 gap-4">
              <Form.Item
                name="watermarkText"
                label="水印文本"
                tooltip="导出商品图片时可选择添加此水印"
                className="mb-0"
              >
                <Input placeholder="请输入水印文本" onChange={(e) => updateWatermarkPreview(e.target.value)} />
              </Form.Item>

              <Form.Item
                name={['watermarkSettings', 'position']}
                label="水印位置"
                initialValue="center"
                className="mb-0"
              >
                <Select onChange={() => updateWatermarkPreview()}>
                  <Select.Option value="center">居中</Select.Option>
                  <Select.Option value="top-left">左上角</Select.Option>
                  <Select.Option value="top-right">右上角</Select.Option>
                  <Select.Option value="bottom-left">左下角</Select.Option>
                  <Select.Option value="bottom-right">右下角</Select.Option>
                </Select>
              </Form.Item>

              <Form.Item
                name={['watermarkSettings', 'mode']}
                label="显示模式"
                initialValue="single"
                className="mb-0"
              >
                <Select onChange={() => updateWatermarkPreview()}>
                  <Select.Option value="single">单个水印</Select.Option>
                  <Select.Option value="tile">平铺水印</Select.Option>
                </Select>
              </Form.Item>

              <Form.Item
                name={['watermarkSettings', 'color']}
                label="水印颜色"
                initialValue="#000000"
                className="mb-0"
              >
                <Input
                  type="color"
                  style={{ width: '100%', padding: '2px' }}
                  onChange={() => updateWatermarkPreview()}
                />
              </Form.Item>
            </div>

            {/* 样式设置 */}
            <div className="grid grid-cols-3 gap-4">
              <Form.Item
                name={['watermarkSettings', 'fontSize']}
                label="字体大小"
                initialValue={20}
                className="mb-0"
              >
                <InputNumber
                  min={12}
                  max={72}
                  style={{ width: '100%' }}
                  onChange={() => updateWatermarkPreview()}
                />
              </Form.Item>

              <Form.Item
                name={['watermarkSettings', 'opacity']}
                label="不透明度"
                initialValue={15}
                className="mb-0"
              >
                <Slider
                  min={1}
                  max={100}
                  onChange={() => updateWatermarkPreview()}
                />
              </Form.Item>

              <Form.Item
                name={['watermarkSettings', 'rotation']}
                label="旋转角度"
                initialValue={0}
                className="mb-0"
              >
                <InputNumber
                  min={-180}
                  max={180}
                  style={{ width: '100%' }}
                  onChange={() => updateWatermarkPreview()}
                />
              </Form.Item>
            </div>

            {/* 智能分析设置 */}
            <div className="flex justify-between items-start bg-gray-50 p-4 rounded">
              <div className="flex items-center gap-6">
                <Form.Item
                  name={['watermarkSettings', 'useSmartColor']}
                  valuePropName="checked"
                  className="mb-0"
                >
                  <Switch
                    checkedChildren="智能水印已开启"
                    unCheckedChildren="智能水印已关闭"
                    onChange={(checked) => handleSmartWatermarkChange('useSmartColor', checked)}
                  />
                </Form.Item>
                <Form.Item
                  name={['watermarkSettings', 'useRegionAnalysis']}
                  valuePropName="checked"
                  className="mb-0"
                >
                  <Switch
                    checkedChildren="区域分析已开启"
                    unCheckedChildren="区域分析已关闭"
                    onChange={(checked) => handleSmartWatermarkChange('useRegionAnalysis', checked)}
                  />
                </Form.Item>
                <Form.Item
                  name={['watermarkSettings', 'useContrastAnalysis']}
                  valuePropName="checked"
                  className="mb-0"
                >
                  <Switch
                    checkedChildren="对比度分析已开启"
                    unCheckedChildren="对比度分析已关闭"
                    onChange={(checked) => handleSmartWatermarkChange('useContrastAnalysis', checked)}
                  />
                </Form.Item>
              </div>
              <div className="text-gray-500 text-sm">
                <div>智能水印：基础亮度分析</div>
                <div>区域分析：考虑水印位置的局部特征</div>
                <div>对比度分析：分析主色调选择对比色</div>
              </div>
            </div>

            {/* 预览区域 */}
            <div className="bg-gray-50 p-4 rounded">
              <div className="flex justify-between items-center mb-4">
                <div className="text-gray-700 font-medium">水印预览效果</div>
                <Space>
                  <input
                    type="file"
                    id="imageInput"
                    accept="image/*"
                    multiple
                    style={{ display: 'none' }}
                    onChange={handleImageUpload}
                  />
                  <Button 
                    type="primary"
                    onClick={() => document.getElementById('imageInput')?.click()}
                  >
                    上传图片预览
                  </Button>
                  <Button 
                    onClick={handleClearImage}
                    disabled={previewImages.length === 0}
                  >
                    清除全部图片
                  </Button>
                  <Button 
                    onClick={() => updateWatermarkPreview()}
                  >
                    刷新预览
                  </Button>
                </Space>
              </div>
              <div className="relative bg-white p-2 rounded shadow-sm">
                {previewImages.length > 0 && (
                  <>
                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-4 z-10">
                      <Button 
                        type="text" 
                        icon={<LeftOutlined />}
                        onClick={() => handleSwitchImage('prev')}
                        className="bg-white/80 hover:bg-white"
                        disabled={previewImages.length <= 1}
                      />
                      <Button 
                        type="text" 
                        icon={<RightOutlined />}
                        onClick={() => handleSwitchImage('next')}
                        className="bg-white/80 hover:bg-white"
                        disabled={previewImages.length <= 1}
                      />
                    </div>
                    <div className="absolute top-2 right-2 z-20">
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleDeleteImage(currentImageIndex)}
                        className="bg-white/80 hover:bg-white"
                      />
                    </div>
                  </>
                )}
                <canvas
                  id="watermarkPreview"
                  width="600"
                  height="300"
                  className="w-full border border-gray-200 rounded"
                  style={{ background: '#f0f0f0' }}
                />
                {previewImages.length > 0 && (
                  <div className="absolute bottom-2 right-2 bg-white/80 px-2 py-1 rounded text-sm">
                    {currentImageIndex + 1} / {previewImages.length}
                  </div>
                )}
              </div>
              <div className="flex justify-between items-center text-gray-400 text-sm mt-2">
                <span>上传实际图片可以预览水印效果</span>
                <span>调整设置后点击刷新预览</span>
              </div>
            </div>
          </div>
        </Card>

        {/* 商品模板 */}
        <Card 
          title="商品模板" 
          className="shadow-sm"
          extra={
            <Button
              type="primary"
              onClick={() => {
                setCurrentTemplate(undefined);
                setIsTemplateModalVisible(true);
              }}
            >
              添加模板
            </Button>
          }
        >
          <div className="space-y-4">
            {templates.map(template => (
              <Card
                key={template.id}
                size="small"
                title={
                  <Space>
                    {template.name}
                    {template.isDefault && <Tag color="blue">默认</Tag>}
                  </Space>
                }
                extra={
                  <Space>
                    {!template.isDefault && (
                      <Button
                        type="link"
                        size="small"
                        onClick={() => handleSetDefaultTemplate(template.id)}
                      >
                        设为默认
                      </Button>
                    )}
                    <Button
                      type="link"
                      size="small"
                      onClick={() => {
                        setCurrentTemplate(template);
                        setIsTemplateModalVisible(true);
                      }}
                    >
                      编辑
                    </Button>
                    <Button
                      type="link"
                      danger
                      size="small"
                      onClick={() => handleDeleteTemplate(template.id)}
                    >
                      删除
                    </Button>
                  </Space>
                }
              >
                <div className="space-y-2">
                  <div>
                    <div className="text-gray-500 mb-1">标题模板：</div>
                    <div className="bg-gray-50 p-2 rounded">{template.title}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 mb-1">文案模板：</div>
                    <div className="bg-gray-50 p-2 rounded whitespace-pre-wrap">{template.description}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Card>
      </Form>

      {/* 模板编辑窗 */}
      <Modal
        title={currentTemplate ? '编辑模板' : '添加模板'}
        open={isTemplateModalVisible}
        onCancel={() => {
          setIsTemplateModalVisible(false);
          setCurrentTemplate(undefined);
        }}
        footer={null}
        width={600}
      >
        <TemplateForm
          initialValues={currentTemplate}
          onSubmit={handleTemplateSubmit}
          onCancel={() => {
            setIsTemplateModalVisible(false);
            setCurrentTemplate(undefined);
          }}
        />
      </Modal>
    </div>
  );
};

const Settings: React.FC = () => {
  const { 
    storeAccounts,
    storeGroups,
    productSettings, 
    addStoreAccount, 
    removeStoreAccount,
    updateStoreAccount,
    updateProductSettings,
    addCategory,
    removeCategory,
    addStoreGroup,
    updateStoreGroup,
    removeStoreGroup,
  } = useSettingsStore();

  const [newCategory, setNewCategory] = useState('');
  const [isGroupModalVisible, setIsGroupModalVisible] = useState(false);
  const [currentGroup, setCurrentGroup] = useState<StoreGroup | undefined>();
  const [groupForm] = Form.useForm();
  const [isStoreModalVisible, setIsStoreModalVisible] = useState(false);
  const [currentStore, setCurrentStore] = useState<StoreAccount | undefined>();
  const [storeForm] = Form.useForm();

  // 处理添加/编辑店铺
  const handleEditStore = (store?: StoreAccount) => {
    setCurrentStore(store);
    if (store && storeForm) {
      storeForm.setFieldsValue({
        name: store.name,
        platform: store.platform,
        watermarkText: store.watermarkText,
        features: {
          templates: store.features.templates || []
        }
      });
    } else {
      storeForm?.resetFields();
    }
    setIsStoreModalVisible(true);
  };

  // 处理删除店铺
  const handleDeleteStore = (store: StoreAccount) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除店铺"${store.name}"吗？`,
      onOk: () => {
        removeStoreAccount(store.id);
        message.success('删除成功');
      },
    });
  };

  // 保存店铺
  const handleSaveStore = async (values: StoreAccount) => {
    try {
      const storeInfo = {
        id: currentStore?.id || uuidv4(),
        name: values.name,
        platform: values.platform,
        watermarkText: values.watermarkText,
        features: {
          ...values.features,
          templates: values.features?.templates || [],
          watermarkSettings: values.watermarkSettings || {} // 保存水印设置
        }
      };

      if (currentStore) {
        updateStoreAccount(currentStore.id, storeInfo);
        message.success('编辑成���');
      } else {
        addStoreAccount(storeInfo);
        message.success('添加成功');
      }
      setIsStoreModalVisible(false);
      storeForm.resetFields();
      setCurrentStore(undefined);
    } catch (error) {
      console.error('保存店铺失败:', error);
      message.error('保存失败，请重试');
    }
  };

  // 店铺表格配置
  const storeColumns = [
    {
      title: '店铺名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '平台',
      dataIndex: 'platform',
      key: 'platform',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: StoreAccount) => (
        <Space size="middle">
          <Button type="link" onClick={() => handleEditStore(record)}>
            <EditOutlined /> 编辑
          </Button>
          <Button type="link" danger onClick={() => handleDeleteStore(record)}>
            <DeleteOutlined /> 删除
          </Button>
        </Space>
      ),
    },
  ];

  // 处理添加分类
  const handleAddCategory = () => {
    if (!newCategory.trim()) {
      message.warning('请输入分类名称');
      return;
    }
    if (productSettings?.categories?.includes(newCategory.trim())) {
      message.warning('该分类已存在');
      return;
    }
    addCategory(newCategory.trim());
    setNewCategory('');
    message.success('添加成功');
  };

  // 处理删除分类
  const handleRemoveCategory = (category: string, e?: React.MouseEvent<HTMLElement, MouseEvent>) => {
    e?.preventDefault();
    e?.stopPropagation();
    
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除分类"${category}"吗？`,
      onOk: () => {
        removeCategory(category);
        message.success('删除成功');
      },
    });
  };

  // 处理按键事件
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddCategory();
    }
  };

  // 处理添加/编辑店铺组
  const handleEditGroup = (group?: StoreGroup) => {
    setCurrentGroup(group);
    if (group) {
      groupForm.setFieldsValue(group);
    } else {
      groupForm.resetFields();
    }
    setIsGroupModalVisible(true);
  };

  // 处理删除店铺组
  const handleDeleteGroup = (group: StoreGroup) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除店铺组"${group.name}"吗？`,
      onOk: () => {
        removeStoreGroup(group.id);
        message.success('删除成功');
      },
    });
  };

  // 保存店铺组
  const handleSaveGroup = async () => {
    try {
      const values = await groupForm.validateFields();
      if (currentGroup) {
        updateStoreGroup(currentGroup.id, values);
        message.success('编辑成功');
      } else {
        addStoreGroup({
          id: uuidv4(),
          ...values,
        });
        message.success('添加成功');
      }
      setIsGroupModalVisible(false);
      groupForm.resetFields();
      setCurrentGroup(undefined);
    } catch (error) {
      // 表单验证错误
    }
  };

  // 店铺组表格列配置
  const groupColumns = [
    {
      title: '组名',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '包含店铺',
      dataIndex: 'storeIds',
      key: 'storeIds',
      render: (storeIds: string[]) => (
        <span>
          {storeIds.map(id => {
            const store = storeAccounts.find(s => s.id === id);
            return store ? store.name : '';
          }).filter(Boolean).join(', ')}
        </span>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: StoreGroup) => (
        <Space size="middle">
          <Button type="link" onClick={() => handleEditGroup(record)}>
            <EditOutlined /> 编辑
          </Button>
          <Button type="link" danger onClick={() => handleDeleteGroup(record)}>
            <DeleteOutlined /> 删除
          </Button>
        </Space>
      ),
    },
  ];

  // 发货方式设置组件
  const DeliveryMethodSettings: React.FC = () => {
    const { productSettings, updateProductSettings } = useSettingsStore();
    const { deliveryMethods = [] } = productSettings;

    const handleToggleMethod = (methodId: string) => {
      const currentMethods = [...deliveryMethods];
      const enabledCount = currentMethods.filter(m => m.isEnabled).length;
      const isCurrentEnabled = currentMethods.find(m => m.id === methodId)?.isEnabled;
      
      if (enabledCount === 1 && isCurrentEnabled) {
        message.warning('至少需要保留一种发货方式');
        return;
      }
      
      const updatedMethods = currentMethods.map(m =>
        m.id === methodId ? { ...m, isEnabled: !m.isEnabled } : m
      );
      
      updateProductSettings({
        deliveryMethods: updatedMethods,
      });
    };

    return (
      <div>
        <div className="flex flex-wrap gap-2 mb-4">
          {deliveryMethods.map(method => (
            <Tag
              key={method.id}
              color={method.isEnabled ? 'blue' : 'default'}
              className="text-base py-1 px-3 cursor-pointer"
              onClick={() => handleToggleMethod(method.id)}
            >
              {method.name}
            </Tag>
          ))}
        </div>
        <div className="text-gray-500 text-sm">
          点击标签可以启用/禁用对应的发货方式，至少需要保留一种发货方式
        </div>
      </div>
    );
  };

  return (
    <div className="p-6">
      <Tabs defaultActiveKey="store">
        <TabPane tab="店铺账号" key="store">
          <div className="space-y-6">
            <Card title="店铺管理" className="shadow-sm">
              <div className="mb-4">
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />} 
                  onClick={() => handleEditStore()}
                >
                  新增店铺
                </Button>
              </div>
              <Table
                columns={storeColumns}
                dataSource={storeAccounts}
                rowKey="id"
                pagination={false}
              />
            </Card>

            <Card title="店铺组管理" className="shadow-sm">
              <div className="mb-4">
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />} 
                  onClick={() => handleEditGroup()}
                >
                  新增店铺组
                </Button>
              </div>
              <Table
                columns={groupColumns}
                dataSource={storeGroups}
                rowKey="id"
                pagination={false}
              />
            </Card>
          </div>
        </TabPane>

        <TabPane tab="商品设置" key="product">
          <div className="space-y-6">
            <Card title="商品分类设置" className="shadow-sm">
              <div className="space-y-4">
                <div className="flex gap-4">
                  <Input
                    placeholder="输入分类名称"
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value)}
                    onKeyPress={handleKeyPress}
                    style={{ width: 200 }}
                    maxLength={20}
                  />
                  <Button 
                    type="primary" 
                    icon={<PlusOutlined />} 
                    onClick={handleAddCategory}
                    disabled={!newCategory.trim()}
                  >
                    添加分类
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {productSettings?.categories?.map(category => (
                    <Tag
                      key={category}
                      closable
                      onClose={(e) => handleRemoveCategory(category, e)}
                      className="text-base py-1 px-3"
                    >
                      {category}
                    </Tag>
                  ))}
                </div>
              </div>
            </Card>

            <Card title="发货方式设置" className="shadow-sm">
              <DeliveryMethodSettings />
            </Card>

            <Card title="分配设置" className="shadow-sm">
              <Form
                layout="vertical"
                initialValues={productSettings?.distributeSettings}
                onValuesChange={(_, values) => {
                  updateProductSettings({
                    distributeSettings: values,
                  });
                }}
              >
                <Form.Item
                  name={['defaultStatus']}
                  label="默认分配状态"
                >
                  <Select
                    options={[
                      { label: '草稿', value: 'draft' },
                      { label: '待审核', value: 'pending' },
                      { label: '待上架', value: 'ready' },
                    ]}
                  />
                </Form.Item>

                <Form.Item
                  name={['priceStrategy', 'useAccountAdjustment']}
                  label="使用店铺价格系数"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>

                <Form.Item
                  name={['priceStrategy', 'roundingRule']}
                  label="价格取整规则"
                >
                  <Select
                    options={[
                      { label: '向上取整', value: 'up' },
                      { label: '向下取整', value: 'down' },
                      { label: '四舍五入', value: 'nearest' },
                    ]}
                  />
                </Form.Item>

                <Form.Item
                  name={['priceStrategy', 'minimumMargin']}
                  label="最小利润"
                >
                  <InputNumber<number>
                    style={{ width: '100%' }}
                    min={0}
                    max={1}
                    step={0.01}
                    formatter={value => `${(value || 0) * 100}%`}
                    parser={value => {
                      const num = parseFloat((value || '').replace('%', ''));
                      return isNaN(num) ? 0 : Math.min(Math.max(num / 100, 0), 1);
                    }}
                  />
                </Form.Item>

                <Form.Item
                  name={['enableSmartContent']}
                  label="启用智能文案"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
              </Form>
            </Card>
          </div>
        </TabPane>
      </Tabs>

      {/* 店铺表单弹窗 */}
      <Modal
        title={currentStore ? '编辑店铺' : '新增店铺'}
        open={isStoreModalVisible}
        onOk={() => storeForm.submit()}
        onCancel={() => {
          setIsStoreModalVisible(false);
          storeForm.resetFields();
          setCurrentStore(undefined);
        }}
        width={1200}
      >
        <StoreForm
          form={storeForm}
          initialValues={currentStore}
          onSubmit={handleSaveStore}
          onCancel={() => {
            setIsStoreModalVisible(false);
            storeForm.resetFields();
            setCurrentStore(undefined);
          }}
        />
      </Modal>

      {/* 店铺组表单弹窗 */}
      <Modal
        title={currentGroup ? '编辑店铺组' : '新增店铺组'}
        open={isGroupModalVisible}
        onOk={handleSaveGroup}
        onCancel={() => {
          setIsGroupModalVisible(false);
          groupForm.resetFields();
          setCurrentGroup(undefined);
        }}
      >
        <Form form={groupForm} layout="vertical">
          <Form.Item
            name="name"
            label="组名"
            rules={[{ required: true, message: '请输入组名' }]}
          >
            <Input placeholder="请输入组名" />
          </Form.Item>
          <Form.Item
            name="storeIds"
            label="选择店���"
            rules={[{ required: true, message: '请选择至少一个店铺' }]}
          >
            <Select
              mode="multiple"
              placeholder="请选择店铺"
              options={storeAccounts.map(store => ({
                label: `${store.name} (${store.platform})`,
                value: store.id,
              }))}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Settings; 