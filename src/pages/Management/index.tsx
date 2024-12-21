import React, { useState, useEffect, useRef } from 'react';
import { Card, Table, Button, Input, Space, Tag, Select, message, Typography, Modal, Upload, Image, Dropdown, DatePicker } from 'antd';
import { ShopOutlined, EditOutlined, StopOutlined, ExclamationCircleOutlined, SyncOutlined, PlusOutlined, DeleteOutlined, FilterFilled } from '@ant-design/icons';
import type { Product } from '../../types/product';
import useSettingsStore from '../../store/settingsStore';
import useProductStore from '../../store/productStore';
import type { ColumnsType } from 'antd/es/table/interface';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';

dayjs.extend(isBetween);

const { Search } = Input;
const { Text } = Typography;
const { confirm } = Modal;

const ProductManagement: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [activeStoreId, setActiveStoreId] = useState<string>('all');
  const [searchText, setSearchText] = useState('');
  const [data, setData] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [dateRange, setDateRange] = useState<string[]>([]);
  
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
    let filteredProducts = products.filter(product => {
      if (activeStoreId !== 'all' && product.storeId !== activeStoreId) {
        return false;
      }

      if (searchText) {
        const searchLower = searchText.toLowerCase();
        const matchName = product.name.toLowerCase().includes(searchLower);
        const matchTitle = product.distributedTitle?.toLowerCase().includes(searchLower);
        const matchCategory = product.category.toLowerCase().includes(searchLower);
        if (!matchName && !matchTitle && !matchCategory) {
          return false;
        }
      }

      const dateFilter = columns.find(col => col.key === 'createdAt')?.filteredValue as string[];
      if (dateFilter && dateFilter.length === 2) {
        const recordTime = dayjs(product.createdAt);
        const startTime = dayjs(dateFilter[0]);
        const endTime = dayjs(dateFilter[1]);
        if (!recordTime.isBetween(startTime, endTime, 'day', '[]')) {
          return false;
        }
      }
      
      return true;
    });

    filteredProducts.sort((a, b) => 
      dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf()
    );

    return filteredProducts;
  };

  const handleBatchDelete = () => {
    confirm({
      title: '确认删除',
      icon: <ExclamationCircleOutlined />,
      content: `确定要删除选中的 ${selectedRowKeys.length} 个商品吗？`,
      onOk: async () => {
        try {
          // TODO: 实现批量删除的功能
          message.success('批量删除成功');
          setSelectedRowKeys([]);
        } catch (error) {
          message.error('删除失败');
        }
      }
    });
  };

  const handleBatchOffline = () => {
    confirm({
      title: '确认下架',
      icon: <ExclamationCircleOutlined />,
      content: `确定要下架选中的 ${selectedRowKeys.length} 个商品吗？`,
      onOk: async () => {
        try {
          // TODO: 实现批量下架的功能
          message.success('批量下架成功');
          setSelectedRowKeys([]);
        } catch (error) {
          message.error('下架失败');
        }
      }
    });
  };

  const batchActionMenuItems = [
    {
      key: 'delete',
      icon: <DeleteOutlined />,
      label: '批量删除',
      onClick: handleBatchDelete,
      danger: true
    },
    {
      key: 'offline',
      icon: <StopOutlined />,
      label: '批量下架',
      onClick: handleBatchOffline
    }
  ];

  const columns: ColumnsType<Product> = [
    {
      title: '商品信息',
      key: 'productInfo',
      render: (_, record: Product) => (
        <Space direction="vertical" size={0}>
          {record.distributedTitle && (
            <Text type="secondary">
              {record.distributedTitle}
            </Text>
          )}
          <Space>
            <Text strong>{record.name}</Text>
            <Tag>{record.category}</Tag>
          </Space>
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
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (createdAt: string) => (
        <Space direction="vertical" size={0}>
          <span>{dayjs(createdAt).format('YYYY-MM-DD')}</span>
          <span style={{ fontSize: '12px', color: '#999' }}>
            {dayjs(createdAt).format('HH:mm:ss')}
          </span>
        </Space>
      ),
      sorter: (a, b) => dayjs(a.createdAt).valueOf() - dayjs(b.createdAt).valueOf(),
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <div style={{ padding: 8 }}>
          <DatePicker.RangePicker
            style={{ width: '100%' }}
            value={selectedKeys.length ? [dayjs(selectedKeys[0] as string), dayjs(selectedKeys[1] as string)] : null}
            onChange={(dates) => {
              if (dates && dates[0] && dates[1]) {
                const newRange = [
                  dates[0].startOf('day').format('YYYY-MM-DD HH:mm:ss'),
                  dates[1].endOf('day').format('YYYY-MM-DD HH:mm:ss')
                ];
                setSelectedKeys(newRange);
                setDateRange(newRange);
              } else {
                setSelectedKeys([]);
                setDateRange([]);
              }
            }}
            ranges={{
              '今天': [dayjs().startOf('day'), dayjs().endOf('day')],
              '本周': [dayjs().startOf('week'), dayjs().endOf('day')],
              '本月': [dayjs().startOf('month'), dayjs()],
              '上个月': [dayjs().subtract(1, 'month').startOf('month'), dayjs().subtract(1, 'month').endOf('month')]
            }}
            placeholder={['开始日期', '结束日期']}
          />
          <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between' }}>
            <Button
              size="small"
              onClick={() => {
                clearFilters?.();
                setDateRange([]);
                confirm();
              }}
            >
              重置
            </Button>
            <Button
              type="primary"
              size="small"
              onClick={() => confirm()}
            >
              确定
            </Button>
          </div>
        </div>
      ),
      filterIcon: (filtered) => (
        <FilterFilled style={{ color: filtered ? '#1890ff' : undefined }} />
      ),
      onFilter: (value: any, record) => {
        if (!value || !Array.isArray(value) || value.length !== 2) return true;
        const recordTime = dayjs(record.createdAt);
        const startTime = dayjs(value[0]);
        const endTime = dayjs(value[1]);
        return recordTime.isBetween(startTime, endTime, 'day', '[]');
      },
      filteredValue: dateRange
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
            {selectedRowKeys.length > 0 && (
              <Dropdown menu={{ items: batchActionMenuItems }}>
                <Button>
                  批量操作 ({selectedRowKeys.length})
                </Button>
              </Dropdown>
            )}
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
        rowSelection={{
          selectedRowKeys,
          onChange: (keys) => setSelectedRowKeys(keys),
        }}
      />
    </div>
  );
};

export default ProductManagement; 