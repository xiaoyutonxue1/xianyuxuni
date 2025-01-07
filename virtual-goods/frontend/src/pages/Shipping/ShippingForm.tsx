import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Form, Input, Select, Button, Card, Space } from 'antd';
import { useStore } from '../../store';
import { Store, ShippingInfo } from '../../types';

const { Option } = Select;
const { TextArea } = Input;

const ShippingForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [form] = Form.useForm();
  
  const { stores, updateStore } = useStore();
  const store = id ? stores.find(s => s.id === id) : undefined;

  const onFinish = (values: { shippingInfo: ShippingInfo }) => {
    if (id) {
      updateStore(id, { shippingInfo: values.shippingInfo });
    }
    navigate('/shipping');
  };

  return (
    <div className="max-w-3xl mx-auto">
      <Card title={store ? `Edit Shipping: ${store.name}` : 'New Shipping'}>
        <Form
          form={form}
          layout="vertical"
          initialValues={store}
          onFinish={onFinish}
        >
          <Form.Item
            name={['shippingInfo', 'method']}
            label="Shipping Method"
            rules={[{ required: true }]}
          >
            <Select>
              <Option value="digital">Digital Delivery</Option>
              <Option value="email">Email Delivery</Option>
              <Option value="api">API Integration</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name={['shippingInfo', 'address']}
            label="Shipping Address"
            rules={[{ required: true }]}
            extra="For digital goods, this could be an email address or API endpoint"
          >
            <Input />
          </Form.Item>

          <Form.Item
            name={['shippingInfo', 'details']}
            label="Additional Details"
            extra="Enter any additional configuration in JSON format"
          >
            <TextArea
              rows={6}
              placeholder="{\n  'apiKey': 'your-api-key',\n  'template': 'delivery-template-1'\n}"
            />
          </Form.Item>

          <Form.Item className="mb-0">
            <Space>
              <Button type="primary" htmlType="submit">
                {id ? 'Update' : 'Create'} Shipping
              </Button>
              <Button onClick={() => navigate('/shipping')}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default ShippingForm;