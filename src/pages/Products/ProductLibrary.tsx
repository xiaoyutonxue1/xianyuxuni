import React, { useState } from 'react';
import { Card, Table, Button, Input, Space, message, Tag, Tooltip } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, RobotOutlined } from '@ant-design/icons';
import useSettingsStore from '../../store/settingsStore';
import ProductForm from './ProductForm';

const { Search } = Input;

// 模拟数据
const mockProducts = [
  {
    id: '1',
    name: '网易云音乐6个月会员',
    category: '音乐会员',
    price: 128,
    stock: 200,
    createdAt: '2024/3/2 16:30:00',
    status: 'active',
    source: 'manual',
  },
  {
    id: '2',
    name: '腾讯视频会员12个月',
    category: '视频会员',
    price: 258,
    stock: 100,
    createdAt: '2024/3/2 14:00:00',
    status: 'active',
    source: 'manual',
  },
  {
    id: '3',
    name: 'Steam充值卡',
    category: '游戏充值',
    price: 88,
    stock: 50,
    createdAt: '2024/3/2 09:00:00',
    status: 'active',
    source: 'manual',
  },
  {
    id: '4',
    name: 'Bilibili大会员',
    category: '视频会员',
    price: 148,
    stock: 0,
    createdAt: '2024/3/2 08:00:00',
    status: 'crawling',
    source: 'crawler',
    productUrl: 'https://www.bilibili.com/vip/buy',
  },
  {
    id: '5',
    name: '爱奇艺黄金会员',
    category: '视频会员',
    price: 198,
    stock: 500,
    createdAt: '2024/3/1 16:30:00',
    status: 'error',
    source: 'crawler',
    productUrl: 'https://vip.iqiyi.com',
    errorMessage: '商品信息抓取失败',
  }
];

// 商品状态配置
const statusConfig = {
  active: { text: '正常', color: 'success' },
  inactive: { text: '已下架', color: 'default' },
  crawling: { text: '抓取中', color: 'processing' },
  error: { text: '抓取失败', color: 'error' },
};

const ProductLibrary: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(mockProducts);
  const [total, setTotal] = useState(mockProducts.length);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const productSettings = useSettingsStore(state => state.productSettings);

  // 处理新增
  const handleAdd = () => {
    setSelectedProduct(null);
    setIsModalVisible(true);
  };

  // 处理编辑
  const handleEdit = (record: any) => {
    setSelectedProduct(record);
    setIsModalVisible(true);
  };

  // 处理表单提交
  const handleFormSubmit = async (values: any) => {
    try {
      setLoading(true);
      if (selectedProduct) {
        // 编辑模式
        const newData = data.map(item =>
          item.id === selectedProduct.id
            ? { ...item, ...values, updatedAt: new Date().toISOString() }
            : item
        );
        setData(newData);
        message.success('商品更新成功');
      } else {
        // 新增模式
        const newProduct = {
          id: Date.now().toString(),
          ...values,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: 'active',
        };
        setData([newProduct, ...data]);
        setTotal(total + 1);
        message.success('商品添加成功');
      }
      setIsModalVisible(false);
    } catch (error) {
      message.error('操作失败');
    } finally {
      setLoading(false);
    }
  };

  // 表格列配置
  const columns = [
    {
      title: '商品名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
    },
    {
      title: '价格',
      dataIndex: 'price',
      key: 'price',
      render: (price: number) => `¥${price}`,
    },
    {
      title: '库存',
      dataIndex: 'stock',
      key: 'stock',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: keyof typeof statusConfig) => (
        <Tag color={statusConfig[status].color}>
          {statusConfig[status].text}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space size="middle">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => {/* 处理删除 */}}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <Card>
        <div className="mb-4 flex justify-between items-center">
          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              新增商品
            </Button>
            <Button icon={<RobotOutlined />}>批量抓取</Button>
          </Space>
          <Space>
            <Search
              placeholder="搜索商品"
              style={{ width: 200 }}
              onSearch={() => {/* 处理搜索 */}}
            />
          </Space>
        </div>

        <Table
          rowKey="id"
          columns={columns}
          dataSource={data}
          loading={loading}
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
          }}
          pagination={{
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
        />
      </Card>

      {/* 使用新的ProductForm组件 */}
      {isModalVisible && (
        <ProductForm
          initialData={selectedProduct}
          onSubmit={handleFormSubmit}
          onCancel={() => setIsModalVisible(false)}
          loading={loading}
        />
      )}
    </div>
  );
};

export default ProductLibrary; 