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
  LoadingOutlined,
  ClockCircleOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  SyncOutlined,
} from '@ant-design/icons';
import useSettingsStore from '../../store/settingsStore';
import CreateProductForm from './CreateProductForm';
import EditProductForm from './EditProductForm';
import { calculateCompleteness, getMissingFields, getCompletenessStatus } from '../../utils/productCompleteness';
import type { TableProps } from 'antd';
import type { ColumnsType, SortOrder } from 'antd/es/table/interface';
import dayjs from 'dayjs';
import ProductFilter from './components/ProductFilter';
import type { Product } from '../../types/product';

const { Search } = Input;
const { confirm } = Modal;

// 商品状态配置
const statusConfig = {
  manual: { 
    text: '手动模式', 
    color: 'success',
    icon: null 
  },
  crawler_pending: { 
    text: '待爬虫', 
    color: 'default',
    icon: <ClockCircleOutlined style={{ marginRight: 4 }} /> 
  },
  crawler_running: { 
    text: '爬虫进行中', 
    color: 'processing',
    icon: <SyncOutlined spin style={{ marginRight: 4 }} /> 
  },
  crawler_success: { 
    text: '爬虫成功', 
    color: 'success',
    icon: <CheckCircleFilled style={{ marginRight: 4 }} /> 
  },
  crawler_failed: { 
    text: '爬虫失败', 
    color: 'error',
    icon: <CloseCircleFilled style={{ marginRight: 4 }} /> 
  },
  inactive: { 
    text: '已下架', 
    color: 'default',
    icon: null 
  },
};

// 从 localStorage 获取数据,如果没有则返回空数组
const getInitialProducts = () => {
  const savedProducts = localStorage.getItem('products');
  if (savedProducts) {
    return JSON.parse(savedProducts);
  }
  return [];
};

const ProductLibrary: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(getInitialProducts());
  const [total, setTotal] = useState(data.length);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [filteredProducts, setFilteredProducts] = useState(data);
  const productSettings = useSettingsStore(state => state.productSettings);
  const confirmModalRef = useRef<any>(null);

  // 更新数据时同时更新 localStorage
  const updateData = (newData: Product[]) => {
    setData(newData);
    setTotal(newData.length);
    localStorage.setItem('products', JSON.stringify(newData));
    // 同时更新筛选结果
    setFilteredProducts(newData);
  };

  // 处理新增
  const handleAdd = () => {
    setIsCreateModalVisible(true);
  };

  // 处理编辑
  const handleEdit = (record: Product) => {
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
        status: values.method === 'manual' ? 'manual' : 'crawler_pending',
        source: values.method,
      };
      const newData = [newProduct, ...data];
      updateData(newData);
      message.success('商品添加成功');
      setIsCreateModalVisible(false);

      // 如果是爬虫模式，模拟爬虫状态变化
      if (values.method === 'crawler') {
        simulateCrawling(newProduct.id);
      }
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
      setData(prevData => {
        const newData = prevData.map(item =>
          item.id === selectedProduct?.id
            ? { ...item, ...values }
            : item
        );
        localStorage.setItem('products', JSON.stringify(newData));
        // 同时更新筛选结果
        setFilteredProducts(newData);
        return newData;
      });
      setTotal(data.length);
      message.success('商品更新成功');
      setIsEditModalVisible(false);
      setSelectedProduct(null);
    } catch (error) {
      message.error('操作失败');
    } finally {
      setLoading(false);
    }
  };

  // 处理删除
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
          updateData(newData);
          setSelectedRowKeys([]);
          message.success('删除成功');
        } catch (error) {
          message.error('删除失败');
        } finally {
          setLoading(false);
          confirmModalRef.current = null;
        }
      },
      onCancel: () => {
        confirmModalRef.current = null;
      },
    });
  };

  // 处理批量删除
  const handleBatchDelete = () => {
    showDeleteConfirm(selectedRowKeys.map(key => key.toString()));
  };

  // 处理批量下架
  const handleBatchOffline = () => {
    const newData = data.map(item => 
      selectedRowKeys.includes(item.id) 
        ? { ...item, status: 'inactive' as const }
        : item
    );
    updateData(newData);
    setSelectedRowKeys([]);
    message.success('批量下架成功');
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
  const columns: ColumnsType<Product> = [
    {
      title: '商品名称',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
      sortDirections: ['ascend', 'descend'] as SortOrder[]
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      sorter: (a: Product, b: Product) => a.category.localeCompare(b.category),
      sortDirections: ['ascend', 'descend'] as const,
    },
    {
      title: '价格',
      dataIndex: 'price',
      key: 'price',
      render: (price: number) => `¥${price}`,
      sorter: (a: Product, b: Product) => a.price - b.price,
      sortDirections: ['ascend', 'descend'] as const,
    },
    {
      title: '库存',
      dataIndex: 'stock',
      key: 'stock',
      sorter: (a: Product, b: Product) => a.stock - b.stock,
      sortDirections: ['ascend', 'descend'] as const,
    },
    {
      title: '商品状态',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (status: keyof typeof statusConfig) => (
        <Tag color={statusConfig[status].color}>
          {statusConfig[status].icon}
          {statusConfig[status].text}
        </Tag>
      ),
      filters: [
        { text: '手动模式', value: 'manual' },
        { text: '待爬虫', value: 'crawler_pending' },
        { text: '爬虫进行中', value: 'crawler_running' },
        { text: '爬虫成功', value: 'crawler_success' },
        { text: '爬虫失败', value: 'crawler_failed' },
        { text: '已下架', value: 'inactive' },
      ],
      onFilter: (value: any, record: Product) => record.status === value,
    },
    {
      title: '完整度',
      key: 'completeness',
      width: 180,
      render: (_: any, record: Product) => {
        // 爬虫模式
        if (record.source === 'crawler') {
          const statusMap = {
            crawler_pending: { percent: 0, status: 'normal' as const },
            crawler_running: { percent: 50, status: 'active' as const },
            crawler_success: { percent: 100, status: 'success' as const },
            crawler_failed: { percent: 50, status: 'exception' as const },
            inactive: { percent: 100, status: 'normal' as const },
          };

          const { percent, status } = statusMap[record.status as keyof typeof statusMap] || 
            { percent: 0, status: 'normal' as const };

          return (
            <Tooltip
              title={record.errorMessage}
              color={record.status === 'crawler_failed' ? '#ff4d4f' : '#fff'}
            >
              <Progress
                percent={percent}
                size="small"
                status={status}
                format={(percent) => (
                  <span style={{ fontSize: '12px' }}>
                    {percent}%
                  </span>
                )}
                style={{ margin: 0 }}
              />
            </Tooltip>
          );
        }

        // 手动模式
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
      sorter: (a: Product, b: Product) => {
        // 爬虫模式
        if (a.source === 'crawler' && b.source === 'crawler') {
          const statusScore = {
            crawler_pending: 0,
            crawler_running: 50,
            crawler_success: 100,
            crawler_failed: 25,
            inactive: 100,
          };
          return (statusScore[a.status as keyof typeof statusScore] || 0) - 
                 (statusScore[b.status as keyof typeof statusScore] || 0);
        }
        // 手动模式
        return calculateCompleteness(a) - calculateCompleteness(b);
      },
      sortDirections: ['descend', 'ascend'] as const,
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Product) => (
        <Space size="middle">
          {record.source === 'manual' && (
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            >
              编辑
            </Button>
          )}
          {record.source === 'crawler' && record.status === 'crawler_failed' && (
            <Button
              type="link"
              icon={<SyncOutlined />}
              onClick={() => simulateCrawling(record.id)}
            >
              重试
            </Button>
          )}
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
  const handleTableChange: TableProps<Product>['onChange'] = (pagination, filters, sorter) => {
    console.log('Table changed:', { pagination, filters, sorter });
  };

  // 处理筛选
  const handleFilter = (filterValues: any) => {
    let filtered = [...data];

    // 分类筛选
    if (filterValues.category) {
      filtered = filtered.filter(product => product.category === filterValues.category);
    }

    // 完整度筛选
    if (filterValues.completeness) {
      const [min, max] = filterValues.completeness.split('-').map(Number);
      filtered = filtered.filter(product => {
        const completeness = calculateCompleteness(product);
        if (max) {
          return completeness >= min && completeness <= max;
        }
        return completeness === min;
      });
    }

    // 规格类型筛选
    if (filterValues.specType) {
      filtered = filtered.filter(product => 
        filterValues.specType === 'single' ? !product.hasSpecs : product.hasSpecs
      );
    }

    // 发货方式筛选
    if (filterValues.deliveryMethod) {
      filtered = filtered.filter(product => {
        if (product.hasSpecs && product.specs) {
          return product.specs.some(spec => spec.deliveryMethod === filterValues.deliveryMethod);
        }
        return product.deliveryMethod === filterValues.deliveryMethod;
      });
    }

    // 日期范围筛选
    if (filterValues.startDate && filterValues.endDate) {
      const startDate = dayjs(filterValues.startDate).startOf('day');
      const endDate = dayjs(filterValues.endDate).endOf('day');
      filtered = filtered.filter(product => {
        const createdAt = dayjs(product.createdAt);
        return createdAt.isAfter(startDate) && createdAt.isBefore(endDate);
      });
    }

    setFilteredProducts(filtered);
  };

  // 模拟爬虫状态变化
  const simulateCrawling = (productId: string) => {
    // 先将状态改为进行中
    setTimeout(() => {
      setData(prevData => {
        const newData = prevData.map(item => 
          item.id === productId
            ? { ...item, status: 'crawler_running' as const }
            : item
        );
        localStorage.setItem('products', JSON.stringify(newData));
        return newData;
      });

      // 随机模拟成功或失败
      setTimeout(() => {
        const isSuccess = Math.random() > 0.3; // 70%的概率成功
        setData(prevData => {
          const finalData = prevData.map(item => 
            item.id === productId
              ? { 
                  ...item, 
                  status: isSuccess ? 'crawler_success' : 'crawler_failed' as const,
                  errorMessage: !isSuccess ? '网络错误或商品已下架' : undefined
                }
              : item
          );
          localStorage.setItem('products', JSON.stringify(finalData));
          return finalData;
        });

        if (!isSuccess) {
          message.error(`商品 ${productId} 爬取失败`);
        } else {
          message.success(`商品 ${productId} 爬取成功`);
        }
      }, Math.random() * 3000 + 2000); // 2-5秒后完成
    }, 1000); // 1秒后开始
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

        <ProductFilter onFilter={handleFilter} />

        <Table
          rowKey="id"
          columns={columns}
          dataSource={filteredProducts.length > 0 ? filteredProducts : data}
          loading={loading}
          rowSelection={{
            selectedRowKeys,
            onChange: (newSelectedRowKeys) => {
              setSelectedRowKeys(newSelectedRowKeys);
            },
          }}
          onChange={handleTableChange}
        />
      </Card>

      {/* 新增商品弹窗 */}
      <Modal
        title="新增商品"
        open={isCreateModalVisible}
        onCancel={() => setIsCreateModalVisible(false)}
        footer={null}
        width={800}
        centered
        destroyOnClose
      >
        <CreateProductForm
          onSubmit={handleCreateSubmit}
          onCancel={() => setIsCreateModalVisible(false)}
        />
      </Modal>

      {/* 编辑商品弹窗 */}
      <Modal
        title="编辑商品"
        open={isEditModalVisible}
        onCancel={() => {
          setIsEditModalVisible(false);
          setSelectedProduct(null);
        }}
        footer={null}
        width={800}
        centered
        destroyOnClose
      >
        {selectedProduct && (
          <EditProductForm
            initialValues={selectedProduct}
            onSubmit={handleEditSubmit}
            onCancel={() => {
              setIsEditModalVisible(false);
              setSelectedProduct(null);
            }}
          />
        )}
      </Modal>
    </div>
  );
};

export default ProductLibrary; 