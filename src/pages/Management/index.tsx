import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Input, Space, Tag, Select, message, Typography, Tooltip } from 'antd';
import { ShopOutlined, ReloadOutlined, EditOutlined, StopOutlined } from '@ant-design/icons';
import type { Product, DistributeStatus } from '../../types/product';
import useSettingsStore from '../../store/settingsStore';
import type { ColumnsType } from 'antd/es/table/interface';

const { Search } = Input;
const { Text } = Typography;

const ProductManagement: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeStoreId, setActiveStoreId] = useState<string>('all');
  const { storeAccounts } = useSettingsStore();

  // 获取商品列表
  const fetchProducts = async () => {
    try {
      setLoading(true);
      // TODO: 替换为实际的API调用
      const mockData = [
        {
          id: '1',
          name: '示例商品1',
          category: 'study' as const,
          price: 99.99,
          stock: 100,
          status: 'published' as const,
          createdAt: new Date().toISOString(),
          store: '默认店铺',
          description: '示例描述',
          source: 'manual' as const,
          hasSpecs: false,
          distributeInfo: [
            {
              storeId: '1', // 对应水城有趣的海鲜
              templateId: '1',
              status: 'published' as DistributeStatus,
              distributedAt: new Date().toISOString(),
              distributedTitle: '【正版资源】示例商品1',
              distributedContent: '✨ 示例描述\n\n💫 发货方式：网盘自动发货\n🌟 售后服务：终身有效'
            }
          ]
        },
      ];
      setProducts(mockData);
    } catch (error) {
      message.error('获取商品列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const columns: ColumnsType<Product> = [
    {
      title: '商品名称',
      key: 'name',
      render: (_, record: Product) => {
        const distributeInfo = record.distributeInfo?.find(info => 
          activeStoreId === 'all' ? true : info.storeId === activeStoreId
        );
        
        return (
          <Space direction="vertical" size={0}>
            <Text strong>{record.name}</Text>
            {distributeInfo?.distributedTitle && (
              <Tooltip title="店铺展示标题">
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  {distributeInfo.distributedTitle}
                </Text>
              </Tooltip>
            )}
          </Space>
        );
      },
    },
    {
      title: '发布账号',
      key: 'store',
      render: (_, record: Product) => {
        const distributeInfo = record.distributeInfo?.find(info => 
          activeStoreId === 'all' ? true : info.storeId === activeStoreId
        );
        
        if (!distributeInfo) return '-';
        
        const store = storeAccounts.find(s => s.id === distributeInfo.storeId);
        return (
          <Space>
            <ShopOutlined />
            <span>{store?.name}</span>
            <Tag color="blue">{store?.platform}</Tag>
          </Space>
        );
      },
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
      title: '发布状态',
      key: 'status',
      render: (_, record: Product) => {
        const distributeInfo = record.distributeInfo?.find(info => 
          activeStoreId === 'all' ? true : info.storeId === activeStoreId
        );
        
        if (!distributeInfo) return '-';

        const statusMap = {
          draft: { color: 'default', text: '草稿' },
          pending: { color: 'processing', text: '待发布' },
          published: { color: 'success', text: '已发布' },
          failed: { color: 'error', text: '发布失败' },
          offline: { color: 'default', text: '已下架' },
        };

        const { color, text } = statusMap[distributeInfo.status];
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record: Product) => {
        const distributeInfo = record.distributeInfo?.find(info => 
          activeStoreId === 'all' ? true : info.storeId === activeStoreId
        );
        
        if (!distributeInfo) return null;
        
        return (
          <Space size="middle">
            <Button 
              type="link" 
              icon={<EditOutlined />}
              onClick={() => {
                // TODO: 实现编辑功能
                console.log('编辑商品:', record.id);
              }}
            >
              编辑
            </Button>
            <Button 
              type="link" 
              danger 
              icon={<StopOutlined />}
              onClick={() => {
                // TODO: 实现下架功能
                console.log('下架商品:', record.id);
              }}
            >
              下架
            </Button>
          </Space>
        );
      },
    },
  ];

  // 根据当前选中的店铺过滤商品
  const filteredProducts = products.filter(product => {
    if (activeStoreId === 'all') return true;
    return product.distributeInfo?.some(info => info.storeId === activeStoreId);
  });

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex justify-between items-center">
          <Space>
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
              icon={<ReloadOutlined />}
              onClick={() => fetchProducts()}
            >
              刷新
            </Button>
          </Space>
          <Search
            placeholder="搜索商品"
            style={{ width: 300 }}
            onSearch={value => console.log(value)}
          />
        </div>
      </Card>

      <Table
        columns={columns}
        dataSource={filteredProducts}
        rowKey="id"
        pagination={{
          showSizeChanger: true,
          showQuickJumper: true,
        }}
        loading={loading}
      />
    </div>
  );
};

export default ProductManagement; 