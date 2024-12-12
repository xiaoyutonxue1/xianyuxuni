import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Input, Space, Modal, Form, Select, message, InputNumber, Switch } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import useSettingsStore from '../../store/settingsStore';
import type { DeliveryMethod } from '../../store/settingsStore';
import { getProducts, createProduct } from '../../services/productService';
import type { ProductListingItem } from '../../types/product';
import type { ProductQueryParams } from '../../services/productService';

const { Search } = Input;

const ProductLibrary: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ProductListingItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isMultiSpecs, setIsMultiSpecs] = useState(false);
  const productSettings = useSettingsStore(state => state.productSettings);

  // 获取商品列表
  const fetchProducts = async (params: ProductQueryParams = { page: 1, pageSize: 10 }) => {
    try {
      setLoading(true);
      const response = await getProducts(params);
      setData(response.items);
      setTotal(response.total);
    } catch (error) {
      message.error('获取商品列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // 处理表格变化
  const handleTableChange = (pagination: any, filters: any, sorter: any) => {
    fetchProducts({
      page: pagination.current,
      pageSize: pagination.pageSize,
      sortField: sorter.field,
      sortOrder: sorter.order,
      ...filters,
    });
  };

  // 新增商品
  const handleAdd = () => {
    form.resetFields();
    setIsModalVisible(true);
  };

  // 保存商品
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      console.log('Form values:', values);
      message.success('保存成功');
      setIsModalVisible(false);
      form.resetFields();
      fetchProducts();
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  const columns = [
    {
      title: '商品名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 120,
    },
    {
      title: '价格',
      dataIndex: 'price',
      key: 'price',
      width: 100,
      render: (price: any) => {
        if (typeof price === 'number') {
          return `￥${price.toFixed(2)}`;
        }
        return '暂无价格';
      },
    },
    {
      title: '库存',
      dataIndex: 'stock',
      key: 'stock',
      width: 100,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (time: string) => new Date(time).toLocaleString(),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: any, record: ProductListingItem) => (
        <Space size="middle">
          <Button type="link" onClick={() => message.info('功能开发中')}>编辑</Button>
          <Button type="link" danger onClick={() => message.info('功能开发中')}>删除</Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex justify-between mb-4">
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增商品
          </Button>
          <Space>
            <Select
              placeholder="选择分类"
              style={{ width: 200 }}
              allowClear
              onChange={value => fetchProducts({ page: 1, pageSize: 10, category: value })}
              options={productSettings?.categories?.map(category => ({
                label: category,
                value: category,
              }))}
            />
            <Search
              placeholder="搜索商品"
              style={{ width: 300 }}
              onSearch={value => fetchProducts({ page: 1, pageSize: 10, keyword: value })}
            />
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          pagination={{
            total,
            showSizeChanger: true,
            showQuickJumper: true,
          }}
          loading={loading}
          onChange={handleTableChange}
        />
      </Card>

      <Modal
        title="新增商品"
        open={isModalVisible}
        onOk={handleSave}
        onCancel={() => {
          setIsModalVisible(false);
          setIsMultiSpecs(false);
          form.resetFields();
        }}
        width={800}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label={<span className="text-red-500">商品名称 *</span>}
            rules={[{ required: true, message: '请输入商品名称' }]}
          >
            <Input placeholder="请输入商品名称" />
          </Form.Item>

          <Form.Item name="category" label="商品分类">
            <Select
              placeholder="请选择商品分类"
              allowClear
              options={productSettings?.categories?.map(category => ({
                label: category,
                value: category,
              }))}
            />
          </Form.Item>

          <Form.Item name="useMultiSpecs" label="规格设置" valuePropName="checked">
            <Switch
              checkedChildren="多规格"
              unCheckedChildren="单规格"
              checked={isMultiSpecs}
              onChange={setIsMultiSpecs}
            />
          </Form.Item>

          {isMultiSpecs ? (
            <Form.List name="specs" initialValue={[{ name: '发货网盘', stock: 999 }]}>
              {(fields, { add, remove }) => (
                <div className="space-y-4">
                  {fields.map((field, index) => (
                    <div key={field.key} className="border rounded p-4">
                      <div className="flex justify-between items-center mb-4">
                        <div className="text-lg">规格 {index + 1}</div>
                        <Button type="link" danger onClick={() => remove(field.name)}>
                          删除
                        </Button>
                      </div>

                      <Form.Item
                        name={[field.name, 'name']}
                        label="规格名称"
                        initialValue="发货网盘"
                      >
                        <Input placeholder="请输入规格名称" />
                      </Form.Item>

                      <Form.Item
                        name={[field.name, 'price']}
                        label="售价（元）"
                      >
                        <InputNumber
                          min={0}
                          precision={2}
                          style={{ width: '100%' }}
                          placeholder="请输入售价"
                        />
                      </Form.Item>

                      <Form.Item
                        name={[field.name, 'stock']}
                        label="库存（件）"
                        initialValue={999}
                      >
                        <InputNumber
                          min={0}
                          style={{ width: '100%' }}
                          placeholder="请输入库存"
                        />
                      </Form.Item>

                      <Form.Item
                        name={[field.name, 'deliveryMethod']}
                        label="发货方式"
                      >
                        <Select
                          placeholder="请选择发货方式"
                          options={productSettings?.deliveryMethods
                            ?.filter(method => method.isEnabled)
                            ?.map(method => ({
                              label: method.name,
                              value: method.value,
                            }))}
                        />
                      </Form.Item>

                      <Form.Item
                        noStyle
                        shouldUpdate={(prevValues: any, currentValues: any) => {
                          const prev = prevValues?.specs?.[field.name]?.deliveryMethod;
                          const curr = currentValues?.specs?.[field.name]?.deliveryMethod;
                          return prev !== curr;
                        }}
                      >
                        {({ getFieldValue }) => {
                          const methodValue = getFieldValue(['specs', field.name, 'deliveryMethod']);
                          const method = productSettings?.deliveryMethods?.find(m => m.value === methodValue);
                          
                          if (!method?.fields) return null;
                          
                          return (
                            <div className="pl-4 border-l-2 border-gray-200">
                              {method.fields.map(fieldConfig => (
                                <Form.Item
                                  key={fieldConfig.id}
                                  name={[field.name, 'deliveryInfo', fieldConfig.key]}
                                  label={fieldConfig.name}
                                >
                                  <Input placeholder={fieldConfig.placeholder} />
                                </Form.Item>
                              ))}
                            </div>
                          );
                        }}
                      </Form.Item>
                    </div>
                  ))}

                  <Button
                    type="dashed"
                    onClick={() => add({ name: '发货网盘', stock: 999 })}
                    style={{ width: '100%' }}
                    icon={<PlusOutlined />}
                  >
                    添加规格
                  </Button>
                </div>
              )}
            </Form.List>
          ) : (
            <>
              <Form.Item name="price" label="售价（元）">
                <InputNumber
                  min={0}
                  precision={2}
                  style={{ width: '100%' }}
                  placeholder="请输入售价"
                />
              </Form.Item>

              <Form.Item name="stock" label="库存（件）" initialValue={999}>
                <InputNumber
                  min={0}
                  style={{ width: '100%' }}
                  placeholder="请输入库存"
                />
              </Form.Item>

              <Form.Item name="deliveryMethod" label="发货方式">
                <Select
                  placeholder="请选择发货方式"
                  options={productSettings?.deliveryMethods
                    ?.filter(method => method.isEnabled)
                    ?.map(method => ({
                      label: method.name,
                      value: method.value,
                    }))}
                />
              </Form.Item>

              <Form.Item
                noStyle
                shouldUpdate={(prevValues: any, currentValues: any) => {
                  return prevValues?.deliveryMethod !== currentValues?.deliveryMethod;
                }}
              >
                {({ getFieldValue }) => {
                  const methodValue = getFieldValue('deliveryMethod');
                  const method = productSettings?.deliveryMethods?.find(m => m.value === methodValue);
                  
                  if (!method?.fields) return null;
                  
                  return (
                    <div className="pl-4 border-l-2 border-gray-200">
                      {method.fields.map(field => (
                        <Form.Item
                          key={field.id}
                          name={['deliveryInfo', field.key]}
                          label={field.name}
                        >
                          <Input placeholder={field.placeholder} />
                        </Form.Item>
                      ))}
                    </div>
                  );
                }}
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default ProductLibrary; 