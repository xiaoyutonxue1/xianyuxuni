import React, { useEffect } from 'react';
import { Form, Input, InputNumber, Select, Slider, Switch, message } from 'antd';
import { StoreAccount } from '../../types/store';
import useSettingsStore from '../../store/settingsStore';

// 字体选项配置
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

const StoreSettingsForm: React.FC<{
  initialValues?: StoreAccount;
  onSubmit: (values: StoreAccount) => void;
  onCancel: () => void;
}> = ({ initialValues, onSubmit, onCancel }) => {
  const [form] = Form.useForm();
  const { updateStoreAccount } = useSettingsStore();

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue({
        ...initialValues,
        watermarkSettings: {
          fontSize: 20,
          opacity: 15,
          position: 'center',
          rotation: 0,
          mode: 'single',
          color: '#000000',
          fontFamily: 'Microsoft YaHei',
          isSmartMode: false,
          ...initialValues.watermarkSettings
        }
      });
    }
  }, [initialValues, form]);

  // 处理智能水印模式切换
  const handleSmartModeChange = (checked: boolean) => {
    const currentValues = form.getFieldsValue();
    const watermarkSettings = {
      ...currentValues.watermarkSettings,
      isSmartMode: checked
    };
    
    // 立即更新表单值
    form.setFieldsValue({
      watermarkSettings
    });

    // 如果是当前编辑的店铺，立即保存更改
    if (initialValues?.id) {
      updateStoreAccount(initialValues.id, {
        watermarkSettings
      });
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      // 确保水印设置的完整性
      const watermarkSettings = {
        fontSize: values.watermarkSettings?.fontSize ?? 20,
        opacity: values.watermarkSettings?.opacity ?? 15,
        position: values.watermarkSettings?.position ?? 'center',
        rotation: values.watermarkSettings?.rotation ?? 0,
        mode: values.watermarkSettings?.mode ?? 'single',
        color: values.watermarkSettings?.color ?? '#000000',
        fontFamily: values.watermarkSettings?.fontFamily ?? 'Microsoft YaHei',
        isSmartMode: values.watermarkSettings?.isSmartMode ?? false
      };

      // 提交完整的表单数据
      await onSubmit({
        ...values,
        watermarkSettings
      });
      
      message.success('保存成功');
    } catch (error) {
      console.error('Failed to save store settings:', error);
      message.error('保存失败，请重试');
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={initialValues}
    >
      <Form.Item
        name="cookie"
        label="店铺Cookie"
      >
        <Input.TextArea rows={4} placeholder="请输入店铺Cookie" />
      </Form.Item>

      <Form.Item
        name="watermarkText"
        label="水印文本"
        tooltip="导出商品图片时可选择添加此水印"
      >
        <Input placeholder="请输入水印文本" />
      </Form.Item>

      <Form.Item
        name={['watermarkSettings', 'isSmartMode']}
        label="智能水印"
        tooltip="开启后将根据图片特征自动调整水印颜色和不透明度"
        valuePropName="checked"
      >
        <Switch onChange={handleSmartModeChange} />
      </Form.Item>

      <Form.Item
        name={['watermarkSettings', 'fontSize']}
        label="字体大小"
      >
        <InputNumber min={1} max={100} defaultValue={20} />
      </Form.Item>

      <Form.Item
        name={['watermarkSettings', 'opacity']}
        label="不透明度"
        dependencies={['watermarkSettings', 'isSmartMode']}
      >
        <Slider
          min={1}
          max={100}
          defaultValue={15}
          marks={{
            1: '1%',
            25: '25%',
            50: '50%',
            75: '75%',
            100: '100%'
          }}
          tooltip={{
            formatter: (value) => `${value}%`
          }}
          disabled={form.getFieldValue(['watermarkSettings', 'isSmartMode'])}
        />
      </Form.Item>

      <Form.Item
        name={['watermarkSettings', 'position']}
        label="水印位置"
      >
        <Select defaultValue="center">
          <Select.Option value="center">居中</Select.Option>
          <Select.Option value="top-left">左上角</Select.Option>
          <Select.Option value="top-right">右上角</Select.Option>
          <Select.Option value="bottom-left">左下角</Select.Option>
          <Select.Option value="bottom-right">右下角</Select.Option>
        </Select>
      </Form.Item>

      <Form.Item
        name={['watermarkSettings', 'rotation']}
        label="旋转角度"
      >
        <InputNumber min={-180} max={180} defaultValue={0} />
      </Form.Item>

      <Form.Item
        name={['watermarkSettings', 'mode']}
        label="显示模式"
      >
        <Select defaultValue="single">
          <Select.Option value="single">单个水印</Select.Option>
          <Select.Option value="tile">平铺水印</Select.Option>
        </Select>
      </Form.Item>

      <Form.Item
        name={['watermarkSettings', 'color']}
        label="水印颜色"
        dependencies={['watermarkSettings', 'isSmartMode']}
      >
        <Input 
          type="color" 
          className="w-full h-8" 
          disabled={form.getFieldValue(['watermarkSettings', 'isSmartMode'])}
        />
      </Form.Item>

      <Form.Item
        name={['watermarkSettings', 'fontFamily']}
        label="水印字体"
        tooltip="选择合适的字体来展示水印文本"
      >
        <Select
          showSearch
          placeholder="请选择字体"
          options={fontOptions}
          optionFilterProp="label"
        />
      </Form.Item>

      <Form.Item
        name="status"
        label="状态"
      >
        <Select>
          <Select.Option value="active">正常</Select.Option>
          <Select.Option value="inactive">已停用</Select.Option>
        </Select>
      </Form.Item>
    </Form>
  );
};

export default StoreSettingsForm; 