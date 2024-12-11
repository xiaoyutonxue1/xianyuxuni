import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Form, Input, Select, Button, Card, Switch } from 'antd';
import { useStore } from '../../store';
import { Template } from '../../types';
import TemplateEditor from './TemplateEditor';

const { Option } = Select;

const TemplateForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [form] = Form.useForm();
  
  const { templates, stores, addTemplate, updateTemplate } = useStore();
  const template = id ? templates.find(t => t.id === id) : undefined;

  const onFinish = (values: Partial<Template>) => {
    if (id) {
      updateTemplate(id, values);
    } else {
      addTemplate({
        ...values,
        id: Date.now().toString(),
      } as Template);
    }
    navigate('/templates');
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card title={id ? 'Edit Template' : 'New Template'}>
        <Form
          form={form}
          layout="vertical"
          initialValues={template}
          onFinish={onFinish}
        >
          <Form.Item
            name="name"
            label="Template Name"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="storeId"
            label="Store"
            rules={[{ required: true }]}
          >
            <Select>
              {stores.map(store => (
                <Option key={store.id} value={store.id}>
                  {store.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="content"
            label="Template Content"
            rules={[{ required: true }]}
          >
            <TemplateEditor />
          </Form.Item>

          <Form.Item
            name="isDefault"
            label="Set as Default Template"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item className="mb-0">
            <Space>
              <Button type="primary" htmlType="submit">
                {id ? 'Update' : 'Create'} Template
              </Button>
              <Button onClick={() => navigate('/templates')}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default TemplateForm;