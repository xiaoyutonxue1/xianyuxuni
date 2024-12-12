import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Input, Space, Tag, Modal, Form, Select, message, InputNumber, Alert } from 'antd';
import { ShoppingCartOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { getProducts, createProduct } from '../../services/productService';
import type { ProductListingItem } from '../../types/product';
import type { ProductQueryParams } from '../../services/productService';
import useSettingsStore from '../../store/settingsStore';

const { Search } = Input;

const ProductSelection: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ProductListingItem[]>([]);
  const [total, setTotal] = useState(0);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<ProductListingItem[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const { storeAccounts, storeGroups } = useSettingsStore();

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

  // 选择商品
  const handleSelect = () => {
    if (selectedProducts.length === 0) {
      message.warning('请选择要发布的商品');
      return;
    }
    setIsModalVisible(true);
  };

  // 发布商品
  const handlePublish = async () => {
    try {
      const values = await form.validateFields();
      const { stores, priceAdjustment } = values;

      // 为每个选中的商品创建店铺商品
      const promises = selectedProducts.map(product => 
        stores.map((storeId: string) => {
          const adjustedPrice = Number(product.price) * (1 + (priceAdjustment || 0));
          return createProduct({
            ...product,
            id: undefined,
            store: storeId,
            price: adjustedPrice.toFixed(2),
            status: 'draft',
            distributedTo: [storeId],
          });
        })
      ).flat();

      await Promise.all(promises);
      message.success('发布成功');
      setIsModalVisible(false);
      form.resetFields();
      setSelectedRowKeys([]);
      setSelectedProducts([]);
    } catch (error) {
      message.error('发布失败');
    }
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[], rows: ProductListingItem[]) => {
      setSelectedRowKeys(keys);
      setSelectedProducts(rows);
    },
  };

  const columns: ColumnsType<ProductListingItem> = [
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
      title: '原价',
      dataIndex: 'originalPrice',
      key: 'originalPrice',
      width: 100,
      render: (price: string) => `￥${price}`,
    },
    {
      title: '建议售价',
      dataIndex: 'price',
      key: 'price',
      width: 100,
      render: (price: string) => `￥${price}`,
    },
  ];

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex justify-between">
          <Button
            type="primary"
            icon={<ShoppingCartOutlined />}
            onClick={handleSelect}
            disabled={selectedRowKeys.length === 0}
          >
            发布到店铺
          </Button>
          <Space>
            <Select
              placeholder="选择分类"
              style={{ width: 200 }}
              allowClear
              onChange={value => fetchProducts({ page: 1, pageSize: 10, category: value })}
              options={[
                { label: '游戏充值', value: '游戏充值' },
                { label: '账号租赁', value: '账号租赁' },
                { label: '代练代打', value: '代练代打' },
              ]}
            />
            <Search
              placeholder="搜索商品"
              style={{ width: 300 }}
              onSearch={value => fetchProducts({ page: 1, pageSize: 10, keyword: value })}
            />
          </Space>
        </div>
      </Card>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        rowSelection={rowSelection}
        pagination={{
          total,
          showSizeChanger: true,
          showQuickJumper: true,
          onChange: (page, pageSize) => fetchProducts({ page, pageSize }),
        }}
        loading={loading}
      />

      <Modal
        title="发布商品"
        open={isModalVisible}
        onOk={handlePublish}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        width={600}
      >
        <div className="mb-4">
          <Alert
            message={`已选择 ${selectedProducts.length} 个商品`}
            description="选中的商品将被发布到所选店铺,每个店铺将创建一个独立商品。"
            type="info"
            showIcon
          />
        </div>
        <Form form={form} layout="vertical">
          <Form.Item
            name="stores"
            label="选择店铺"
            rules={[{ required: true, message: '请选择至少一个店铺' }]}
          >
            <Select
              mode="multiple"
              placeholder="请选择要发布的店铺"
              style={{ width: '100%' }}
              options={[
                {
                  label: '店铺组',
                  options: storeGroups.map(group => ({
                    label: `${group.name} (${group.storeIds.length}家店铺)`,
                    value: `group:${group.id}`,
                  })),
                },
                {
                  label: '单个店铺',
                  options: storeAccounts.map(account => ({
                    label: `${account.name} (${account.platform})`,
                    value: account.id,
                  })),
                },
              ]}
              onChange={(values: string[]) => {
                // 处理组选择，展开组内所有店铺
                const selectedStores = values.map(value => {
                  if (value.startsWith('group:')) {
                    const groupId = value.replace('group:', '');
                    const group = storeGroups.find(g => g.id === groupId);
                    return group ? group.storeIds : [];
                  }
                  return value;
                }).flat();
                
                // 去重
                const uniqueStores = [...new Set(selectedStores)];
                form.setFieldValue('stores', uniqueStores);
              }}
            />
          </Form.Item>

          <Form.Item
            name="priceAdjustment"
            label="价格调整"
            tooltip="输入调整比例，例如：0.1表示上调10%，-0.1表示下调10%"
          >
            <InputNumber<number>
              style={{ width: '100%' }}
              step={0.01}
              formatter={value => value ? `${(value * 100).toFixed(0)}%` : ''}
              parser={value => value ? Number(value.replace('%', '')) / 100 : 0}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ProductSelection; 