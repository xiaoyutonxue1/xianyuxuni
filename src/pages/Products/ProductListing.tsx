import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Input, Space, Tag, Modal, Form, Select, message, Tooltip, InputNumber } from 'antd';
import { EditOutlined, DeleteOutlined, CopyOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import useSettingsStore from '../../store/settingsStore';
import type { StoreAccount } from '../../store/settingsStore';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../../services/productService';
import type { ProductListingItem } from '../../types/product';
import type { ProductQueryParams } from '../../services/productService';

const { Search } = Input;

const ProductListing: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ProductListingItem[]>([]);
  const [total, setTotal] = useState(0);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<ProductListingItem[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentItem, setCurrentItem] = useState<ProductListingItem>();
  const [form] = Form.useForm();
  const { storeAccounts } = useSettingsStore();

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

  // 编辑商品
  const handleEdit = (record: ProductListingItem) => {
    setCurrentItem(record);
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  // 删除商品
  const handleDelete = (record: ProductListingItem) => {
    Modal.confirm({
      title: '删除商品',
      content: `确定删除商品"${record.name}"吗？删除后不可恢复。`,
      async onOk() {
        try {
          await deleteProduct(record.id);
          message.success('删除成功');
          fetchProducts();
        } catch (error) {
          message.error('删除失败');
        }
      },
    });
  };

  // 复制商品到其他店铺
  const handleCopy = (record: ProductListingItem) => {
    Modal.confirm({
      title: '复制商品',
      content: (
        <Form layout="vertical">
          <Form.Item
            label="选择目标店铺"
            name="targetStores"
            rules={[{ required: true, message: '请选择至少一个店铺' }]}
          >
            <Select
              mode="multiple"
              placeholder="请选择要复制到的店铺"
              style={{ width: '100%' }}
              options={storeAccounts
                .filter(account => account.id !== record.store)
                .map(account => ({
                  label: `${account.name} (${account.platform})`,
                  value: account.id,
                }))}
            />
          </Form.Item>
        </Form>
      ),
      async onOk() {
        try {
          const values = await form.validateFields();
          const { targetStores } = values;

          // 为每个目标店铺创建商品副本
          await Promise.all(
            targetStores.map((storeId: string) =>
              createProduct({
                ...record,
                id: undefined,
                store: storeId,
                status: 'draft',
              })
            )
          );

          message.success('复制成功');
          fetchProducts();
        } catch (error) {
          message.error('复制失败');
        }
      },
    });
  };

  // 保存商品
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      if (currentItem) {
        await updateProduct(currentItem.id, values);
        message.success('编辑成功');
      }
      setIsModalVisible(false);
      form.resetFields();
      fetchProducts();
    } catch (error) {
      message.error('操作失败');
    }
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
      title: '售价',
      dataIndex: 'price',
      key: 'price',
      width: 100,
      render: (price: string) => `￥${price}`,
    },
    {
      title: '库存',
      dataIndex: 'stock',
      key: 'stock',
      width: 100,
    },
    {
      title: '销量',
      dataIndex: 'sales',
      key: 'sales',
      width: 100,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const statusMap = {
          draft: { color: 'orange', text: '草稿' },
          selling: { color: 'green', text: '在售' },
          offline: { color: 'red', text: '下架' },
        };
        const { color, text } = statusMap[status as keyof typeof statusMap];
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Space size="middle">
          <a onClick={() => handleEdit(record)}>
            <EditOutlined /> 编辑
          </a>
          <a onClick={() => handleCopy(record)}>
            <CopyOutlined /> 复制
          </a>
          <a onClick={() => handleDelete(record)}>
            <DeleteOutlined /> 删除
          </a>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex justify-between">
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
            <Select
              placeholder="商品状态"
              style={{ width: 200 }}
              allowClear
              onChange={value => fetchProducts({ page: 1, pageSize: 10, status: value })}
              options={[
                { label: '草稿', value: 'draft' },
                { label: '在售', value: 'selling' },
                { label: '下架', value: 'offline' },
              ]}
            />
          </Space>
          <Search
            placeholder="搜索商品"
            style={{ width: 300 }}
            onSearch={value => fetchProducts({ page: 1, pageSize: 10, keyword: value })}
          />
        </div>
      </Card>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        pagination={{
          total,
          showSizeChanger: true,
          showQuickJumper: true,
          onChange: (page, pageSize) => fetchProducts({ page, pageSize }),
        }}
        loading={loading}
      />

      <Modal
        title="编辑商品"
        open={isModalVisible}
        onOk={handleSave}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        width={800}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="商品名称"
            rules={[{ required: true, message: '请输入商品名称' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="category"
            label="商品分类"
            rules={[{ required: true, message: '请选择商品分类' }]}
          >
            <Select
              placeholder="请选择商品分类"
              options={[
                { label: '游戏充值', value: '游戏充值' },
                { label: '账号租赁', value: '账号租赁' },
                { label: '代练代打', value: '代练代打' },
              ]}
            />
          </Form.Item>

          <Form.Item
            name="originalPrice"
            label="原价"
            rules={[{ required: true, message: '请输入原价' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              precision={2}
              prefix="￥"
            />
          </Form.Item>

          <Form.Item
            name="price"
            label="售价"
            rules={[{ required: true, message: '请输入售价' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              precision={2}
              prefix="￥"
            />
          </Form.Item>

          <Form.Item
            name="stock"
            label="库存"
            rules={[{ required: true, message: '请输入库存' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              precision={0}
            />
          </Form.Item>

          <Form.Item
            name="status"
            label="状态"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select
              placeholder="请选择商品状态"
              options={[
                { label: '草稿', value: 'draft' },
                { label: '在售', value: 'selling' },
                { label: '下架', value: 'offline' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ProductListing; 