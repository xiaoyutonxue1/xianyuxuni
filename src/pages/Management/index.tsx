import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Input, Space, Tag, Select, message, Typography, Modal, Upload, Image } from 'antd';
import { ShopOutlined, EditOutlined, StopOutlined, ExclamationCircleOutlined, SyncOutlined, PlusOutlined } from '@ant-design/icons';
import type { Product } from '../../types/product';
import useSettingsStore from '../../store/settingsStore';
import useProductStore from '../../store/productStore';
import type { ColumnsType } from 'antd/es/table/interface';

const { Search } = Input;
const { Text } = Typography;
const { confirm } = Modal;

const ProductManagement: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [activeStoreId, setActiveStoreId] = useState<string>('all');
  const [searchText, setSearchText] = useState('');
  
  const { storeAccounts } = useSettingsStore();
  const { products, updateProduct } = useProductStore();

  useEffect(() => {
    console.log('商品管理页面 - 商品数据:', products);
  }, [products]);

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      message.success('数据已刷新');
    }, 1000);
  };

  const handleOffline = (record: Product) => {
    confirm({
      title: '确认下架',
      icon: <ExclamationCircleOutlined />,
      content: `确定要下架商品"${record.name}"吗？`,
      onOk: async () => {
        try {
          const updatedProduct = {
            ...record,
            status: 'offline' as const,
            lastUpdated: new Date().toISOString()
          };
          updateProduct(updatedProduct);
          message.success('商品已下架');
        } catch (error) {
          message.error('操作失败');
        }
      }
    });
  };

  const handlePublish = (record: Product) => {
    confirm({
      title: '确认发布',
      icon: <ExclamationCircleOutlined />,
      content: `确定要发布商品"${record.name}"吗？`,
      onOk: async () => {
        try {
          const updatedProduct = {
            ...record,
            status: 'published' as const,
            publishedAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString()
          };
          updateProduct(updatedProduct);
          message.success('商品已发布');
        } catch (error) {
          message.error('操作失败');
        }
      }
    });
  };

  const handleEdit = (record: Product) => {
    message.info('编辑功能开发中');
  };

  const getFilteredProducts = () => {
    const filteredProducts = products.filter(product => {
      if (activeStoreId !== 'all' && product.storeId !== activeStoreId) {
        return false;
      }

      if (searchText) {
        const searchLower = searchText.toLowerCase();
        return (
          product.name.toLowerCase().includes(searchLower) ||
          product.distributedTitle?.toLowerCase().includes(searchLower) ||
          product.category.toLowerCase().includes(searchLower)
        );
      }
      
      return true;
    });

    return filteredProducts;
  };

  const columns: ColumnsType<Product> = [
    {
      title: '商品信息',
      key: 'productInfo',
      render: (_, record: Product) => (
        <Space direction="vertical" size={0}>
          <Space>
            <Text strong>{record.name}</Text>
            <Tag>{record.category}</Tag>
          </Space>
          {record.distributedTitle && (
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.distributedTitle}
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: '头图',
      key: 'coverImage',
      width: 120,
      render: (_, record: Product) => (
        <Space direction="vertical" size={4} align="center">
          {record.coverImage ? (
            <>
              <Image
                src={record.coverImage}
                alt="商品头图"
                width={80}
                height={80}
                style={{ objectFit: 'cover' }}
              />
            </>
          ) : null}
        </Space>
      ),
    },
    {
      title: '发布店铺',
      key: 'store',
      render: (_, record: Product) => {
        const store = storeAccounts.find(s => s.id === record.storeId);
        return (
          <Space direction="vertical" size={0}>
            <Space>
              <ShopOutlined />
              <Text>{store?.name}</Text>
              <Tag color="blue">{store?.platform}</Tag>
            </Space>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              模板ID: {record.templateId}
            </Text>
          </Space>
        );
      },
      filters: storeAccounts.map(store => ({
        text: store.name,
        value: store.id,
      })),
      onFilter: (value, record) => record.storeId === value,
    },
    {
      title: '价格/库存',
      key: 'priceAndStock',
      render: (_, record: Product) => (
        <Space direction="vertical" size={0}>
          <Text strong>¥{record.price}</Text>
          <Text type="secondary">库存: {record.stock}</Text>
        </Space>
      ),
    },
    {
      title: '状态',
      key: 'status',
      render: (_, record: Product) => {
        const statusMap = {
          draft: { color: 'default', text: '草稿' },
          pending: { color: 'processing', text: '待发布' },
          published: { color: 'success', text: '已发布' },
          failed: { color: 'error', text: '发布失败' },
          offline: { color: 'default', text: '已下架' },
        };

        const { color, text } = statusMap[record.status];
        return (
          <Space direction="vertical" size={0}>
            <Tag color={color}>{text}</Tag>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.distributedAt ? `分配于 ${new Date(record.distributedAt).toLocaleDateString()}` : ''}
            </Text>
            {record.publishedAt && (
              <Text type="secondary" style={{ fontSize: '12px' }}>
                发布于 ${new Date(record.publishedAt).toLocaleDateString()}
              </Text>
            )}
          </Space>
        );
      },
      filters: [
        { text: '草稿', value: 'draft' },
        { text: '待发布', value: 'pending' },
        { text: '已发布', value: 'published' },
        { text: '发布失败', value: 'failed' },
        { text: '已下架', value: 'offline' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record: Product) => (
        <Space size="middle">
          {record.status === 'draft' && (
            <Button
              type="link"
              onClick={() => handlePublish(record)}
            >
              发布
            </Button>
          )}
          {record.status !== 'offline' && (
            <>
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
                icon={<StopOutlined />}
                onClick={() => handleOffline(record)}
              >
                下架
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-4">
      <Card>
        <div className="flex justify-between items-center">
          <Space size="middle">
            <Select
              value={activeStoreId}
              onChange={setActiveStoreId}
              style={{ width: 200 }}
              placeholder="选择店铺"
            >
              <Select.Option value="all">全部店铺</Select.Option>
              {storeAccounts.map(store => (
                <Select.Option key={store.id} value={store.id}>
                  <Space>
                    <ShopOutlined />
                    {store.name}
                    <Tag color="blue">{store.platform}</Tag>
                  </Space>
                </Select.Option>
              ))}
            </Select>
            <Button
              icon={<SyncOutlined />}
              onClick={handleRefresh}
              loading={loading}
            >
              刷新
            </Button>
          </Space>
          
          <Search
            placeholder="搜索商品名称/分发标题"
            style={{ width: 300 }}
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            allowClear
          />
        </div>
      </Card>

      <Table
        columns={columns}
        dataSource={getFilteredProducts()}
        rowKey="id"
        pagination={{
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: total => `共 ${total} 条记录`,
        }}
        loading={loading}
      />
    </div>
  );
};

export default ProductManagement; 