import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Form, Input, Select, InputNumber, Button, Upload, Card } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { useStore } from '../../store';
import { Product } from '../../types';

const { Option } = Select;
const { TextArea } = Input;

const ProductForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [form] = Form.useForm();
  
  const { products, addProduct, updateProduct } = useStore();
  const product = id ? products.find(p => p.id === id) : undefined;

  const onFinish = (values: Partial<Product>) => {
    if (id) {
      updateProduct(id, values);
    } else {
      addProduct({
        ...values,
        id: Date.now().toString(),
        lastUpdated: new Date().toISOString(),
        crawlerStatus: 'none',
      } as Product);
    }
    navigate('/products');
  };

  return (
    <div className="max-w-3xl mx-auto">
      <Card title={id ? 'Edit Product' : 'New Product'}>
        <Form
          form={form}
          layout="vertical"
          initialValues={product}
          onFinish={onFinish}
        >
          <Form.Item
            name="name"
            label="Product Name"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="category"
            label="Category"
            rules={[{ required: true }]}
          >
            <Select>
              <Option value="digital">Digital</Option>
              <Option value="virtual">Virtual</Option>
              <Option value="service">Service</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="store"
            label="Store"
            rules={[{ required: true }]}
          >
            <Select>
              <Option value="store1">Store 1</Option>
              <Option value="store2">Store 2</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true }]}
          >
            <TextArea rows={4} />
          </Form.Item>

          <Form.Item
            name="price"
            label="Price"
            rules={[{ required: true }]}
          >
            <InputNumber min={0} className="w-32" />
          </Form.Item>

          <Form.Item
            name="originalPrice"
            label="Original Price"
            rules={[{ required: true }]}
          >
            <InputNumber min={0} className="w-32" />
          </Form.Item>

          <Form.Item
            name="stock"
            label="Stock"
            rules={[{ required: true }]}
          >
            <InputNumber min={0} className="w-32" />
          </Form.Item>

          <Form.Item
            name="mainImage"
            label="Main Image"
          >
            <Upload>
              <Button icon={<UploadOutlined />}>Upload</Button>
            </Upload>
          </Form.Item>

          <Form.Item className="mb-0">
            <Space>
              <Button type="primary" htmlType="submit">
                {id ? 'Update' : 'Create'} Product
              </Button>
              <Button onClick={() => navigate('/products')}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default ProductForm;