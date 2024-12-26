import React, { useState, useEffect, useRef } from 'react';
import { Card, Tabs, Form, Input, Button, Select, InputNumber, Switch, Space, Tag, message, Modal, Table, Divider, Slider } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
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

// 更新字体选项配置
const fontOptions = [
  {
    label: '非衬线体',
    options: [
      { label: '微软雅黑', value: 'Microsoft YaHei' },
      { label: '思源黑体', value: 'Source Han Sans CN' },
      { label: '苹方', value: 'PingFang SC' },
      { label: '阿里巴巴普惠体', value: 'Alibaba PuHuiTi' },
      { label: '黑体', value: 'SimHei' },
      { label: 'Helvetica', value: 'Helvetica' },
      { label: 'Arial', value: 'Arial' }
    ]
  },
  {
    label: '衬线体',
    options: [
      { label: '宋体', value: 'SimSun' },
      { label: '思源宋体', value: 'Source Han Serif CN' },
      { label: '方正书宋', value: 'FangSong' },
      { label: '楷体', value: 'KaiTi' },
      { label: 'Times New Roman', value: 'Times New Roman' },
      { label: 'Georgia', value: 'Georgia' }
    ]
  },
  {
    label: '艺术字体',
    options: [
      { label: '华文行楷', value: 'STXingkai' },
      { label: '华文楷体', value: 'STKaiti' },
      { label: '华文隶书', value: 'STLiti' },
      { label: '华文琥珀', value: 'STHupo' },
      { label: '幼圆', value: 'YouYuan' }
    ]
  }
];

// 店铺表单
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
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);
  const [watermarkPosition, setWatermarkPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (form && initialValues) {
      form.setFieldsValue(initialValues);
      setTemplates(initialValues.features?.templates || []);
    }
  }, [form, initialValues]);

  // 处理预览图片上传
  const handlePreviewImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    try {
      const newImages: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const imageUrl = URL.createObjectURL(file);
        newImages.push(imageUrl);
      }
      // 合并新上传的图片和已有的图片
      setPreviewImages(prev => [...prev, ...newImages]);
      // 如果是第一次上传图片，设置当前预览索引
      if (previewImages.length === 0) {
        setCurrentPreviewIndex(0);
      }

      // 分析第一张新上传的图片
      if (newImages.length > 0) {
        const img = new Image();
        img.src = newImages[0];
        
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) return;

          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          
          if (form.getFieldValue(['watermarkSettings', 'smartMode'])) {
            const { color, opacity } = analyzeImage(imageData);
            form.setFieldsValue({
              watermarkSettings: {
                ...form.getFieldValue('watermarkSettings'),
                color,
                opacity
              }
            });
          }

          updateWatermarkPreview();
        };
      }
    } catch (error) {
      console.error('处理预览图片失败:', error);
      message.error('处理预览图片失败，请重试');
    }
    // 清空input的value，确保相同文件可以重复上传
    e.target.value = '';
  };

  // 删除单张图片
  const handleDeleteImage = (index: number) => {
    setPreviewImages(prev => {
      const newImages = [...prev];
      newImages.splice(index, 1);
      // 如果删除的是当前预览的图片，调整预览索引
      if (currentPreviewIndex >= newImages.length) {
        setCurrentPreviewIndex(Math.max(0, newImages.length - 1));
      } else if (index < currentPreviewIndex) {
        setCurrentPreviewIndex(currentPreviewIndex - 1);
      }
      return newImages;
    });
  };

  // 更新水印预览
  const updateWatermarkPreview = (text?: string) => {
    const canvas = document.getElementById('watermarkPreview') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 如果有预览图片，绘制当前选中的图片
    if (previewImages.length > 0) {
      const img = new Image();
      img.src = previewImages[currentPreviewIndex];
      img.onload = () => {
        // 计算缩放比例以适应canvas
        const scale = Math.min(
          canvas.width / img.width,
          canvas.height / img.height
        );
        const width = img.width * scale;
        const height = img.height * scale;
        const x = (canvas.width - width) / 2;
        const y = (canvas.height - height) / 2;

        // 绘制图片
        ctx.drawImage(img, x, y, width, height);

        // 保存图片区域信息
        const imageArea = { x, y, width, height };

        // 绘制水印时传入图片区域信息
        drawWatermark(ctx, imageArea, text);
      };
    } else {
      // 绘制背景
      ctx.fillStyle = '#f8f8f8';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // 在没有图片时使用整个canvas作为区域
      const imageArea = { x: 0, y: 0, width: canvas.width, height: canvas.height };
      drawWatermark(ctx, imageArea, text);
    }
  };

  const handleSubmit = (values: any) => {
    onSubmit({
      ...values,
      features: {
        ...values.features,
        templates,
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

  // 修改水印绘制函数，避免重复渲染背景
  const drawWatermark = (
    ctx: CanvasRenderingContext2D, 
    imageArea: { x: number; y: number; width: number; height: number }, 
    text?: string,
    skipBackground: boolean = false
  ) => {
    const values = form.getFieldsValue();
    const watermarkText = text ?? values.watermarkText;
    const settings = values.watermarkSettings || {};
    
    if (!watermarkText) return;

    // 设置水印样式
    const fontSize = settings.fontSize || 20;
    const opacity = (settings.opacity || 15) / 100;
    const position = settings.position || 'center';
    const rotation = (settings.rotation || 0) * Math.PI / 180;
    const mode = settings.mode || 'single';
    const color = settings.color || '#000000';
    const fontFamily = settings.fontFamily || 'Microsoft YaHei';
    
    // 添加字体加载检查
    document.fonts.load(`${fontSize}px ${fontFamily}`).then(() => {
      if (!skipBackground) {
        ctx.save();
        // 清空画布
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        
        // 如果有预览图片，重新绘制片
        if (previewImages.length > 0) {
          const img = new Image();
          img.src = previewImages[currentPreviewIndex];
          img.onload = () => {
            const scale = Math.min(
              ctx.canvas.width / img.width,
              ctx.canvas.height / img.height
            );
            const width = img.width * scale;
            const height = img.height * scale;
            const x = (ctx.canvas.width - width) / 2;
            const y = (ctx.canvas.height - height) / 2;
            ctx.drawImage(img, x, y, width, height);
            drawWatermarkContent(ctx, imageArea, watermarkText, settings);
          };
        } else {
          ctx.fillStyle = '#f8f8f8';
          ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
          drawWatermarkContent(ctx, imageArea, watermarkText, settings);
        }
        ctx.restore();
      } else {
        // 只重绘水印，不重绘背景
        drawWatermarkContent(ctx, imageArea, watermarkText, settings);
      }
    });
  };

  // 修改drawWatermarkContent函数，优化重绘逻辑
  const drawWatermarkContent = (
    ctx: CanvasRenderingContext2D,
    imageArea: { x: number; y: number; width: number; height: number },
    watermarkText: string,
    settings: any
  ) => {
    // 每次绘制前清空整个画布
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    // 重新绘制背景图片
    if (previewImages.length > 0) {
      const img = new Image();
      img.src = previewImages[currentPreviewIndex];
      const scale = Math.min(
        ctx.canvas.width / img.width,
        ctx.canvas.height / img.height
      );
      const width = img.width * scale;
      const height = img.height * scale;
      const x = (ctx.canvas.width - width) / 2;
      const y = (ctx.canvas.height - height) / 2;
      ctx.drawImage(img, x, y, width, height);
    } else {
      ctx.fillStyle = '#f8f8f8';
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }

    ctx.save();
    
    // 设置水印样式
    const fontSize = settings.fontSize || 20;
    const opacity = (settings.opacity || 15) / 100;
    const position = settings.position || 'center';
    const rotation = (settings.rotation || 0) * Math.PI / 180;
    const mode = settings.mode || 'single';
    const color = settings.color || '#000000';
    const fontFamily = settings.fontFamily || 'Microsoft YaHei';

    ctx.font = `${fontSize}px ${fontFamily}`;
    ctx.fillStyle = color;
    ctx.globalAlpha = opacity;
    
    // 限制绘制区域在图片范围内
    ctx.beginPath();
    ctx.rect(imageArea.x, imageArea.y, imageArea.width, imageArea.height);
    ctx.clip();
    
    if (mode === 'single') {
      // 使用拖拽位置或计算预设位置
      let { x, y } = watermarkPosition || calculateWatermarkPosition(position, imageArea);
      
      // 确保水印在图片区域内
      x = Math.max(imageArea.x + fontSize, Math.min(x, imageArea.x + imageArea.width - fontSize));
      y = Math.max(imageArea.y + fontSize, Math.min(y, imageArea.y + imageArea.height - fontSize));
      
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.translate(x, y);
      ctx.rotate(rotation);
      ctx.fillText(watermarkText, 0, 0);
    } else {
      // ... existing tile mode code ...
    }
    
    ctx.restore();
  };

  // 分析图片并获取最佳水印参数
  const analyzeImage = (imageData: ImageData): {
    color: string;
    opacity: number;
  } => {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    
    // 计算中心区域（使用更大的采样区域）
    const centerSize = Math.min(width, height) * 0.6; // 增加采样区域到60%
    const centerX = width / 2;
    const centerY = height / 2;
    const startX = Math.max(0, centerX - centerSize / 2);
    const startY = Math.max(0, centerY - centerSize / 2);
    const endX = Math.min(width, centerX + centerSize / 2);
    const endY = Math.min(height, centerY + centerSize / 2);
    
    let totalBrightness = 0;
    let edgeStrength = 0;
    let pixelCount = 0;
    
    // 用于颜色分析的变量
    let histogram = new Array(256).fill(0); // 亮度直方图
    let dominantColors = new Map(); // 主导色统计
    
    // 分析图片特征
    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        const i = (y * width + x) * 4;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // 计算感知亮度 (使用更精确的ITU-R BT.709标准)
        const brightness = Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b);
        totalBrightness += brightness;
        histogram[brightness]++;
        
        // 统计主导色
        const colorKey = `${Math.floor(r/32)},${Math.floor(g/32)},${Math.floor(b/32)}`;
        dominantColors.set(colorKey, (dominantColors.get(colorKey) || 0) + 1);
        
        // 计算局部对比度
        if (x > startX && y > startY && x < endX - 1 && y < endY - 1) {
          const dx = Math.abs(data[i] - data[i + 4]);
          const dy = Math.abs(data[i] - data[i + width * 4]);
          edgeStrength += Math.sqrt(dx * dx + dy * dy); // 使用欧几里得距离
        }
        
        pixelCount++;
      }
    }
    
    // 计算图片特征
    const avgBrightness = totalBrightness / pixelCount;
    const complexity = edgeStrength / (pixelCount * Math.sqrt(2 * 255 * 255));
    
    // 计算亮度分布特征
    const medianIndex = pixelCount / 2;
    let count = 0;
    let medianBrightness = 0;
    for (let i = 0; i < 256; i++) {
      count += histogram[i];
      if (count >= medianIndex) {
        medianBrightness = i;
        break;
      }
    }
    
    // 计算亮度标准差
    let variance = 0;
    for (let i = 0; i < 256; i++) {
      variance += Math.pow(i - avgBrightness, 2) * histogram[i];
    }
    const stdDev = Math.sqrt(variance / pixelCount);
    
    // 根据图片特征计算水印参数
    const baseOpacity = 20; // 基础不透明度提高到20%
    const complexityFactor = Math.min(Math.round(complexity * 150), 25); // 根据复杂度调整不透明度
    const contrastFactor = Math.min(Math.round(stdDev / 8), 15); // 根据对比度调整不透明度
    
    // 综合考虑多个因素计算最终不透明度
    const opacity = Math.min(Math.max(
      baseOpacity + complexityFactor + contrastFactor,
      20
    ), 45);
    
    // 优化颜色选择逻辑
    let color = '#ffffff'; // 默认使用白色
    
    // 使用更复杂的判断逻辑
    const darkThreshold = 85; // 暗色阈值
    const brightThreshold = 170; // 亮色阈值
    const contrastThreshold = 40; // 对比度阈值
    
    if (
      avgBrightness > brightThreshold || // 图片很亮
      (medianBrightness > brightThreshold && stdDev < contrastThreshold) || // 中等亮度但很均匀
      (avgBrightness > 128 && complexity < 0.1) // 中等亮度且很简单
    ) {
      color = '#000000'; // 使用黑色
    } else if (
      avgBrightness < darkThreshold || // 图片很暗
      (medianBrightness < darkThreshold && stdDev < contrastThreshold) || // 中等暗度且均匀
      (complexity > 0.3 && avgBrightness < 128) // 复杂且偏暗
    ) {
      color = '#ffffff'; // 使用白色
    } else {
      // 对于中间情况，根据主导色的亮度决定
      const sortedColors = Array.from(dominantColors.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3); // 取前三个主导色
        
      const dominantBrightness = sortedColors.reduce((acc, [key, count]) => {
        const [r, g, b] = key.split(',').map(x => parseInt(x) * 32);
        return acc + (0.2126 * r + 0.7152 * g + 0.0722 * b) * count;
      }, 0) / sortedColors.reduce((acc, [_, count]) => acc + count, 0);
      
      color = dominantBrightness > 128 ? '#000000' : '#ffffff';
    }
    
    return {
      color,
      opacity
    };
  };

  // 修改handleDragMove函数，优化拖动逻辑
  const handleDragMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const imageArea = getImageArea();
    if (!imageArea) return;
    
    // 更新水印位置
    setWatermarkPosition({ x, y });
    
    // 直接调用drawWatermarkContent重绘整个画布
    const values = form.getFieldsValue();
    const watermarkText = values.watermarkText;
    const settings = values.watermarkSettings || {};
    
    if (watermarkText) {
      drawWatermarkContent(ctx, imageArea, watermarkText, settings);
    }
  };

  // 修改handleDragEnd函数，保持拖动位置
  const handleDragEnd = () => {
    if (!isDragging || !watermarkPosition || !canvasRef.current) return;
    
    setIsDragging(false);
    
    // 根据最终位置更新水印位置设置
    const imageArea = getImageArea();
    if (!imageArea) return;
    
    const { x, y } = watermarkPosition;
    const position = determinePosition(x, y, imageArea);
    form.setFieldValue(['watermarkSettings', 'position'], position);
    
    // 保持当前拖拽位置，不重置watermarkPosition
    const ctx = canvasRef.current.getContext('2d');
    if (ctx) {
      const values = form.getFieldsValue();
      const watermarkText = values.watermarkText;
      const settings = values.watermarkSettings || {};
      if (watermarkText) {
        drawWatermarkContent(ctx, imageArea, watermarkText, settings);
      }
    }
  };

  // 获取图片区域信息
  const getImageArea = () => {
    if (!canvasRef.current) return null;
    
    const canvas = canvasRef.current;
    if (previewImages.length > 0) {
      const img = new Image();
      img.src = previewImages[currentPreviewIndex];
      const scale = Math.min(
        canvas.width / img.width,
        canvas.height / img.height
      );
      const width = img.width * scale;
      const height = img.height * scale;
      const x = (canvas.width - width) / 2;
      const y = (canvas.height - height) / 2;
      return { x, y, width, height };
    }
    return {
      x: 0,
      y: 0,
      width: canvas.width,
      height: canvas.height
    };
  };

  // 根据拖拽位置确定最近的预设位置
  const determinePosition = (x: number, y: number, imageArea: { x: number; y: number; width: number; height: number }) => {
    const relativeX = (x - imageArea.x) / imageArea.width;
    const relativeY = (y - imageArea.y) / imageArea.height;
    
    if (relativeX < 0.33) {
      return relativeY < 0.33 ? 'top-left' : relativeY > 0.67 ? 'bottom-left' : 'center';
    } else if (relativeX > 0.67) {
      return relativeY < 0.33 ? 'top-right' : relativeY > 0.67 ? 'bottom-right' : 'center';
    }
    return 'center';
  };

  // 计算水印实际位置
  const calculateWatermarkPosition = (position: string, imageArea: { x: number; y: number; width: number; height: number }) => {
    const values = form.getFieldsValue();
    const settings = values.watermarkSettings || {};
    const fontSize = settings.fontSize || 20;
    const padding = Math.min(fontSize, imageArea.width * 0.1);
    
    switch (position) {
      case 'top-left':
        return {
          x: imageArea.x + padding,
          y: imageArea.y + padding + fontSize/2
        };
      case 'top-right':
        return {
          x: imageArea.x + imageArea.width - padding,
          y: imageArea.y + padding + fontSize/2
        };
      case 'bottom-left':
        return {
          x: imageArea.x + padding,
          y: imageArea.y + imageArea.height - padding - fontSize/2
        };
      case 'bottom-right':
        return {
          x: imageArea.x + imageArea.width - padding,
          y: imageArea.y + imageArea.height - padding - fontSize/2
        };
      default:
        return {
          x: imageArea.x + imageArea.width / 2,
          y: imageArea.y + imageArea.height / 2
        };
    }
  };

  // 添加handleDragStart函数
  const handleDragStart = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    
    // 检查是否点击在水印文字区域
    const values = form.getFieldsValue();
    const settings = values.watermarkSettings || {};
    const position = settings.position || 'center';
    const imageArea = getImageArea();
    if (!imageArea) return;
    
    // 获取当前水印位置
    const currentPos = watermarkPosition || calculateWatermarkPosition(position, imageArea);
    const clickRadius = Math.max(50, settings.fontSize || 20); // 点击判定范围随字体大小变化
    
    // 检查点击是否在水印区域内
    if (
      Math.abs(x - currentPos.x) < clickRadius &&
      Math.abs(y - currentPos.y) < clickRadius
    ) {
      setIsDragging(true);
      setWatermarkPosition({ x, y });
    }
  };

  return (
    <div className="space-y-4">
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={initialValues}
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
            <div className="grid grid-cols-4 gap-4">
              <Form.Item
                name="watermarkText"
                label="水印文本"
                tooltip="导出商品图片时可选择添加此水印"
                className="mb-0"
              >
                <Input.TextArea 
                  placeholder="请输入水印文本" 
                  rows={1}
                  onChange={(e) => updateWatermarkPreview(e.target.value)}
                />
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

            <div className="grid grid-cols-4 gap-4">
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
                  tooltip={{ formatter: (value) => `${value}%` }}
                  marks={{
                    1: '1%',
                    25: '25%',
                    50: '50%',
                    75: '75%',
                    100: '100%'
                  }}
                />
              </Form.Item>

              <Form.Item
                name={['watermarkSettings', 'rotation']}
                label="旋转角度"
                initialValue={15}
                className="mb-0"
              >
                <InputNumber
                  min={-180}
                  max={180}
                  style={{ width: '100%' }}
                  onChange={() => updateWatermarkPreview()}
                />
              </Form.Item>

              <Form.Item
                name={['watermarkSettings', 'fontFamily']}
                label="水印字体"
                tooltip="选择水印文字的字体,不同字体会呈现不同的视觉效果"
              >
                <Select
                  placeholder="请选择字体"
                  options={fontOptions}
                  showSearch
                  optionFilterProp="label"
                  style={{ width: '100%' }}
                  onChange={() => updateWatermarkPreview()}
                />
              </Form.Item>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3 my-5">
                <div className="flex justify-between items-center h-8">
                  <span className="text-gray-700 font-medium">预览图片</span>
                  <Space>
                    {previewImages.length > 0 && (
                      <Button 
                        size="small"
                        onClick={() => {
                          setPreviewImages([]);
                          setCurrentPreviewIndex(0);
                        }}
                      >
                        清空图片
                      </Button>
                    )}
                    <Button 
                      type="primary"
                      size="small"
                      onClick={() => document.getElementById('previewImage')?.click()}
                    >
                      上传图片
                    </Button>
                  </Space>
                </div>
                <div 
                  className="aspect-video bg-gray-50 rounded-lg overflow-hidden border-2 border-dashed border-gray-200 hover:border-blue-400 transition-colors cursor-pointer relative group"
                  onClick={() => document.getElementById('previewImage')?.click()}
                >
                  {previewImages.length > 0 ? (
                    <img
                      src={previewImages[currentPreviewIndex]}
                      alt="预览图"
                      className="w-full h-full object-contain bg-[#f8f8f8]"
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <div className="text-gray-400 mb-2">点击或拖拽上传图片</div>
                      <div className="text-gray-300 text-sm">支持多张图片上传（JPG、PNG）</div>
                    </div>
                  )}
                  <input
                    type="file"
                    id="previewImage"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handlePreviewImageUpload}
                  />
                </div>

                {previewImages.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto py-2">
                    {previewImages.map((image, index) => (
                      <div
                        key={image}
                        className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden cursor-pointer border-2 transition-all group ${
                          index === currentPreviewIndex 
                            ? 'border-blue-500 shadow-md' 
                            : 'border-transparent hover:border-blue-300'
                        }`}
                        onClick={() => {
                          setCurrentPreviewIndex(index);
                          const img = new Image();
                          img.src = image;
                          img.onload = () => {
                            // 检查是否开启了智能水印
                            if (form.getFieldValue(['watermarkSettings', 'smartMode'])) {
                              const canvas = document.createElement('canvas');
                              const ctx = canvas.getContext('2d');
                              if (!ctx) return;

                              canvas.width = img.width;
                              canvas.height = img.height;
                              ctx.drawImage(img, 0, 0);
                              const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                              const { color, opacity } = analyzeImage(imageData);
                              
                              // 更新表单值
                              const newSettings = {
                                ...form.getFieldValue('watermarkSettings'),
                                color,
                                opacity
                              };
                              
                              // 使用setFieldsValue更新整个watermarkSettings对象
                              form.setFieldsValue({
                                watermarkSettings: newSettings
                              });
                              
                              // 强制触发表单更新
                              setTimeout(() => {
                                updateWatermarkPreview();
                              }, 0);
                            } else {
                              updateWatermarkPreview();
                            }
                          };
                        }}
                      >
                        <img
                          src={image}
                          alt={`预览图${index + 1}`}
                          className="w-full h-full object-contain bg-[#f8f8f8]"
                        />
                        <div 
                          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteImage(index);
                          }}
                        >
                          <Button 
                            type="primary" 
                            danger 
                            size="small" 
                            shape="circle" 
                            icon={<DeleteOutlined />}
                            className="flex items-center justify-center"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-3 my-5">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-medium">水印效果</span>
                  <Form.Item
                    name={['watermarkSettings', 'smartMode']}
                    valuePropName="checked"
                    initialValue={false}
                    className="mb-0"
                  >
                    <Switch 
                      checkedChildren="智能水印开启" 
                      unCheckedChildren="智能水印关闭"
                      onChange={(checked) => {
                        if (checked && previewImages.length > 0) {
                          const img = new Image();
                          img.src = previewImages[currentPreviewIndex];
                          img.onload = () => {
                            const canvas = document.createElement('canvas');
                            const ctx = canvas.getContext('2d');
                            if (!ctx) return;

                            canvas.width = img.width;
                            canvas.height = img.height;
                            ctx.drawImage(img, 0, 0);
                            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                            const { color, opacity } = analyzeImage(imageData);
                            
                            // 更新表单值
                            const newSettings = {
                              ...form.getFieldValue('watermarkSettings'),
                              smartMode: checked,
                              color,
                              opacity
                            };
                            
                            // 使用setFieldsValue更新整个watermarkSettings对象
                            form.setFieldsValue({
                              watermarkSettings: newSettings
                            });
                            
                            // 强制触发表单更新
                            setTimeout(() => {
                              updateWatermarkPreview();
                            }, 0);
                          };
                        } else {
                          // 关闭智能水印时，重置为默认值
                          const defaultSettings = {
                            ...form.getFieldValue('watermarkSettings'),
                            smartMode: false,
                            color: '#000000',
                            opacity: 15
                          };
                          
                          form.setFieldsValue({
                            watermarkSettings: defaultSettings
                          });
                          updateWatermarkPreview();
                        }
                      }}
                    />
                  </Form.Item>
                </div>
                <div className="aspect-video bg-[#f8f8f8] rounded-lg overflow-hidden border-2 border-gray-200">
                  <canvas
                    id="watermarkPreview"
                    ref={canvasRef}
                    width="800"
                    height="450"
                    className={`w-full h-full ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                    onMouseDown={handleDragStart}
                    onMouseMove={handleDragMove}
                    onMouseUp={handleDragEnd}
                    onMouseLeave={handleDragEnd}
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 bg-blue-50 text-blue-600 p-3 rounded-lg text-sm flex items-start">
              <div className="mr-2 mt-0.5">ℹ️</div>
              <div>
                <div className="font-medium mb-1">智能水印说明</div>
                <div className="text-blue-500">
                  开启智能水印后，系统会分析图片特征（亮度、对比度、复杂度等），自动调整水印颜色和透明度，确保水印清晰可见且不影响图片整体美观。您也可以在此基础上手动微调各项参数。
                </div>
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

      {/* 模板编辑弹窗 */}
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
          templates: values.features?.templates || []
        }
      };

      if (currentStore) {
        updateStoreAccount(currentStore.id, storeInfo);
        message.success('编辑成功');
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

  // 店铺表格列配置
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
      title: '���作',
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

            <Card title="��铺组管理" className="shadow-sm">
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
                  label="最小利润率"
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
            label="选择店铺"
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