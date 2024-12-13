import React, { useState, useRef } from 'react';
import { Card, Table, Button, Input, Space, message, Tag, Tooltip, Modal, Dropdown, Progress } from 'antd';
import { 
  PlusOutlined, 
  DeleteOutlined, 
  EditOutlined, 
  RobotOutlined,
  DownOutlined,
  StopOutlined,
  ExportOutlined,
  ExclamationCircleFilled,
  CheckCircleFilled,
  InfoCircleFilled
} from '@ant-design/icons';
import useSettingsStore from '../../store/settingsStore';
import CreateProductForm from './CreateProductForm';
import EditProductForm from './EditProductForm';
import { calculateCompleteness, getMissingFields, getCompletenessStatus } from '../../utils/productCompleteness';
import type { TableProps } from 'antd';
import dayjs from 'dayjs';

const { Search } = Input;
const { confirm } = Modal;

// 模拟数据
const mockProducts = [
  {
    id: '1',
    name: '网易云音乐6个月会员',
    category: '音乐会员',
    price: 128,
    stock: 200,
    createdAt: '2024-03-02 16:30:00',
    status: 'active',
    source: 'manual',
  },
  {
    id: '2',
    name: '腾讯视频会员12个月',
    category: '视频会员',
    price: 258,
    stock: 100,
    createdAt: '2024-03-02 14:00:00',
    status: 'active',
    source: 'manual',
  },
  {
    id: '3',
    name: 'Steam充值卡',
    category: '游戏充值',
    price: 88,
    stock: 50,
    createdAt: '2024-03-02 09:00:00',
    status: 'active',
    source: 'manual',
  },
  {
    id: '4',
    name: 'Bilibili大会员',
    category: '视频会员',
    price: 148,
    stock: 0,
    createdAt: '2024-03-02 08:00:00',
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
    createdAt: '2024-03-01 16:30:00',
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
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const productSettings = useSettingsStore(state => state.productSettings);
  const confirmModalRef = useRef<any>(null);

  // 处理新增
  const handleAdd = () => {
    setIsCreateModalVisible(true);
  };

  // 处理编辑
  const handleEdit = (record: any) => {
    setSelectedProduct(record);
    setIsEditModalVisible(true);
  };

  // 处理新增表单提交
  const handleCreateSubmit = async (values: any) => {
    try {
      setLoading(true);
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
      setIsCreateModalVisible(false);
    } catch (error) {
      message.error('操作失败');
    } finally {
      setLoading(false);
    }
  };

  // 处理编辑表单提交
  const handleEditSubmit = async (values: any) => {
    try {
      setLoading(true);
      const newData = data.map(item =>
        item.id === selectedProduct.id
          ? { ...item, ...values, updatedAt: new Date().toISOString() }
          : item
      );
      setData(newData);
      message.success('商品更新成功');
      setIsEditModalVisible(false);
    } catch (error) {
      message.error('操作失败');
    } finally {
      setLoading(false);
    }
  };

  // 处理单个删除
  const handleDelete = (id: string) => {
    if (confirmModalRef.current) return;
    showDeleteConfirm([id]);
  };

  // 显示删除确认框
  const showDeleteConfirm = (ids: string[]) => {
    if (confirmModalRef.current) return;
    
    confirmModalRef.current = confirm({
      title: '确认删除',
      icon: <ExclamationCircleFilled />,
      content: `确定要删除选中的 ${ids.length} 个商品吗？此操作不可恢复！`,
      okText: '确定',
      okType: 'danger',
      cancelText: '取消',
      centered: true,
      onOk: async () => {
        try {
          setLoading(true);
          const newData = data.filter(item => !ids.includes(item.id));
          setData(newData);
          setTotal(newData.length);
          setSelectedRowKeys([]);
          message.success({
            content: '删除成功',
            duration: 2,
            style: {
              marginTop: '20vh',
            },
          });
        } catch (error) {
          message.error({
            content: '删除失败',
            duration: 2,
            style: {
              marginTop: '20vh',
            },
          });
        } finally {
          setLoading(false);
          confirmModalRef.current = null;
        }
      },
      onCancel: () => {
        confirmModalRef.current = null;
      }
    });
  };

  // 处理批量删除
  const handleBatchDelete = () => {
    if (confirmModalRef.current) return;
    showDeleteConfirm(selectedRowKeys.map(key => key.toString()));
  };

  // 显示下架确认框
  const showOfflineConfirm = (ids: string[]) => {
    if (confirmModalRef.current) return;
    
    confirmModalRef.current = confirm({
      title: '确认下架',
      icon: <ExclamationCircleFilled />,
      content: `确定要下架选中的 ${ids.length} 个商品吗？`,
      okText: '确定',
      cancelText: '取消',
      centered: true,
      onOk: async () => {
        try {
          setLoading(true);
          const newData = data.map(item => 
            ids.includes(item.id)
              ? { ...item, status: 'inactive' }
              : item
          );
          setData(newData);
          setSelectedRowKeys([]);
          message.success({
            content: '下架成功',
            duration: 2,
            style: {
              marginTop: '20vh',
            },
          });
        } catch (error) {
          message.error({
            content: '操作失败',
            duration: 2,
            style: {
              marginTop: '20vh',
            },
          });
        } finally {
          setLoading(false);
          confirmModalRef.current = null;
        }
      },
      onCancel: () => {
        confirmModalRef.current = null;
      }
    });
  };

  // 处理批量下架
  const handleBatchOffline = () => {
    showOfflineConfirm(selectedRowKeys.map(key => key.toString()));
  };

  // 批量操作菜单
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
    },
    {
      key: 'export',
      icon: <ExportOutlined />,
      label: '导出数据'
    }
  ];

  // 表格列配置
  const columns = [
    {
      title: '商品名称',
      dataIndex: 'name',
      key: 'name',
      sorter: (a: any, b: any) => a.name.localeCompare(b.name),
      sortDirections: ['ascend', 'descend'] as const,
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      sorter: (a: any, b: any) => a.category.localeCompare(b.category),
      sortDirections: ['ascend', 'descend'] as const,
    },
    {
      title: '价格',
      dataIndex: 'price',
      key: 'price',
      render: (price: number) => `¥${price}`,
      sorter: (a: any, b: any) => a.price - b.price,
      sortDirections: ['ascend', 'descend'] as const,
    },
    {
      title: '库存',
      dataIndex: 'stock',
      key: 'stock',
      sorter: (a: any, b: any) => a.stock - b.stock,
      sortDirections: ['ascend', 'descend'] as const,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (createdAt: string) => dayjs(createdAt).format('YYYY/MM/DD HH:mm:ss'),
      sorter: (a: any, b: any) => dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix(),
      sortDirections: ['ascend', 'descend'] as const,
      defaultSortOrder: 'descend',
    },
    {
      title: '完整度',
      key: 'completeness',
      width: 180,
      render: (_, record) => {
        const percent = calculateCompleteness(record);
        const missingFields = getMissingFields(record);
        
        return (
          <Tooltip
            title={
              missingFields.length > 0 ? (
                <div className="p-2">
                  <div className="text-base text-red-500 mb-2">
                    未填写项目
                  </div>
                  <div className="bg-red-50 rounded p-2">
                    {missingFields.map((field, index) => (
                      <div key={index} className="text-red-400 py-0.5">
                        • {field}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null
            }
            overlayStyle={{ 
              maxWidth: '400px',
              borderRadius: '8px',
            }}
            overlayInnerStyle={{
              borderRadius: '8px',
            }}
            color="#fff"
            placement="right"
          >
            <div className="cursor-pointer">
              <Progress
                percent={percent}
                size="small"
                status={getCompletenessStatus(percent)}
                format={(percent) => (
                  <span style={{ fontSize: '12px' }}>
                    {percent}%
                  </span>
                )}
                strokeColor={{
                  '0%': '#108ee9',
                  '100%': '#87d068',
                }}
                style={{ margin: 0 }}
              />
            </div>
          </Tooltip>
        );
      },
      sorter: (a, b) => calculateCompleteness(a) - calculateCompleteness(b),
      sortDirections: ['descend', 'ascend'] as const,
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
      filters: [
        { text: '正常', value: 'active' },
        { text: '已下架', value: 'inactive' },
        { text: '抓取中', value: 'crawling' },
        { text: '抓取失败', value: 'error' },
      ],
      onFilter: (value: string, record: any) => record.status === value,
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
            onClick={() => handleDelete(record.id)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  // 处理表格变化
  const handleTableChange: TableProps<any>['onChange'] = (pagination, filters, sorter) => {
    // 处理排序和筛选
    console.log('Table changed:', { pagination, filters, sorter });
  };

  return (
    <div className="p-6">
      <Card>
        <div className="mb-4 flex justify-between items-center">
          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              新增商品
            </Button>
            <Button icon={<RobotOutlined />}>批量抓取</Button>
            {selectedRowKeys.length > 0 && (
              <Dropdown 
                menu={{ 
                  items: batchActionMenuItems,
                  onClick: ({ key }) => {
                    const item = batchActionMenuItems.find(item => item.key === key);
                    item?.onClick?.();
                  }
                }}
              >
                <Button>
                  批量操作 ({selectedRowKeys.length}) <DownOutlined />
                </Button>
              </Dropdown>
            )}
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
            onChange: (keys) => {
              setSelectedRowKeys(keys);
            },
            preserveSelectedRowKeys: false
          }}
          pagination={{
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
          onChange={handleTableChange}
          sortDirections={['ascend', 'descend']}
        />
      </Card>

      {/* 新增商品表单 */}
      {isCreateModalVisible && (
        <CreateProductForm
          onSubmit={handleCreateSubmit}
          onCancel={() => setIsCreateModalVisible(false)}
          loading={loading}
        />
      )}

      {/* 编辑商品表单 */}
      {isEditModalVisible && selectedProduct && (
        <EditProductForm
          initialData={selectedProduct}
          onSubmit={handleEditSubmit}
          onCancel={() => setIsEditModalVisible(false)}
          loading={loading}
        />
      )}
    </div>
  );
};

export default ProductLibrary; 