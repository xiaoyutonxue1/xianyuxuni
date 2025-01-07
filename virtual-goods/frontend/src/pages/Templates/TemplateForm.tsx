import React from 'react';
import { Form, Input, Button, Space, Modal } from 'antd';
import TemplateEditor from './TemplateEditor';
import type { Template, TemplateFormValues } from '../../types/template';

export interface TemplateFormProps {
  initialValues?: Template;
  onSubmit: (values: TemplateFormValues) => Promise<boolean>;
  onCancel: () => void;
}

const TemplateForm: React.FC<TemplateFormProps> = ({
  initialValues,
  onSubmit,
  onCancel
}) => {
  const [form] = Form.useForm();

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      onSubmit(values);
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={initialValues}
    >
      <Form.Item
        label="模板名称"
        name="name"
        rules={[{ required: true, message: '请输入模板名称' }]}
      >
        <Input placeholder="请输入模板名称" />
      </Form.Item>

      <Form.Item
        label="模板内容"
        name="content"
        rules={[{ required: true, message: '请输入模板内容' }]}
      >
        <TemplateEditor 
          template={initialValues as Template}
          onSave={(template) => {
            form.setFieldsValue({ content: template.content });
          }}
          onCancel={() => {}}
        />
      </Form.Item>

      <Form.Item>
        <Space>
          <Button type="primary" onClick={handleSubmit}>
            保存
          </Button>
          <Button onClick={onCancel}>取消</Button>
        </Space>
      </Form.Item>
    </Form>
  );
};

export default TemplateForm;