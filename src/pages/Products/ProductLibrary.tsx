import React, { useState, useRef, useEffect } from 'react';
import { Card, Table, Button, Input, Space, message, Tag, Tooltip, Modal, Dropdown, Progress, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
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
import useSelectionStore from '../../store/selectionStore';
import CreateProductForm from './CreateProductForm';
import EditProductForm from './EditProductForm';
import { calculateCompleteness, getMissingFields, getCompletenessStatus } from '../../utils/productCompleteness';
import type { TableProps } from 'antd';
import type { ColumnsType, SortOrder } from 'antd/es/table/interface';
import type { CreateProductRequest } from '../../types/product';
import dayjs from 'dayjs';
import ProductFilter from './components/ProductFilter';
import type { Product } from '../../types/product';

const { Search } = Input;
const { confirm } = Modal;
const { Text } = Typography;

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
  const navigate = useNavigate();
  const { addSelection } = useSelectionStore();
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [data, setData] = useState<any[]>(getInitialProducts());
  const [searchText, setSearchText] = useState('');
  const [filterValues, setFilterValues] = useState<any>({});
  const [sortField, setSortField] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('descend');
  const [total, setTotal] = useState(data.length);
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
  const handleCreateSubmit = async (values: CreateProductRequest) => {
    try {
      // 创建新的选品记录
      const newSelection = {
        id: Date.now().toString(),
        name: values.name,
        category: values.category,
        price: values.price,
        stock: values.stock,
        status: values.method === 'manual' ? 'manual' : 'crawler_pending',
        createdAt: new Date().toISOString(),
        description: values.description,
        source: values.method,
        hasSpecs: values.hasSpecs,
        saleInfo: values.hasSpecs ? undefined : {
          price: values.price,
          stock: values.stock,
          deliveryMethod: values.deliveryMethod,
          deliveryInfo: values.deliveryInfo,
          originalPrice: values.price
        },
        specs: values.hasSpecs ? values.specs : undefined,
        lastUpdated: new Date().toISOString()
      };

      // 添加到当前页面的数据中
      const newData = [newSelection, ...data];
      updateData(newData);

      // 如果是手动模式,同时添加到选品库(使用不同的状态)
      if (values.method === 'manual') {
        addSelection({
          ...newSelection,
          status: 'pending' // 在选品库中使用待分配状态
        });
      }

      message.success('选品创建成功');
      setIsCreateModalVisible(false);

      // 如果是爬虫模式,模拟爬虫状态变化
      if (values.method === 'crawler') {
        simulateCrawling(newSelection.id);
      }
    } catch (error) {
      message.error('创建失败');
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
      width: 300,
      render: (text, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{text}</Text>
          {record.category && <Tag>{record.category}</Tag>}
          {record.description && (
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.description}
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: '价格/库存',
      key: 'priceAndStock',
      width: 150,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text>¥{record.price}</Text>
          <Text type="secondary">库存: {record.stock}</Text>
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 150,
      render: (status: keyof typeof statusConfig) => {
        const config = statusConfig[status] || {
          text: status,
          color: 'default',
          icon: null
        };
        return (
          <Tag color={config.color}>
            {config.icon}{config.text}
          </Tag>
        );
      },
      filters: [
        { text: '手动模式', value: 'manual' },
        { text: '待爬虫', value: 'crawler_pending' },
        { text: '爬虫进行中', value: 'crawler_running' },
        { text: '爬虫成功', value: 'crawler_success' },
        { text: '爬虫失败', value: 'crawler_failed' },
        { text: '已下架', value: 'inactive' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: '完整度',
      key: 'completeness',
      width: 200,
      render: (_, record) => {
        const completeness = calculateCompleteness(record);
        const missingFields = getMissingFields(record);
        const status = getCompletenessStatus(completeness);
        
        // 根据完整度计算渐变色
        const getGradientColor = (percent: number) => {
          // 从红色渐变到绿色
          const red = Math.round(255 * (100 - percent) / 100);
          const green = Math.round(255 * percent / 100);
          return `rgb(${red}, ${green}, 0)`;
        };
        
        return (
          <Tooltip 
            title={
              missingFields.length > 0 
                ? `缺失字段: ${missingFields.join(', ')}` 
                : '信息完整'
            }
          >
            <Progress 
              percent={completeness} 
              size="small"
              strokeColor={{
                '0%': '#108ee9',
                '100%': '#87d068',
              }}
              trailColor="#f5f5f5"
              format={(percent) => `${percent}%`}
            />
          </Tooltip>
        );
      },
      filters: [
        { text: '100%', value: '100-100' },
        { text: '75-99%', value: '75-99' },
        { text: '50-74%', value: '50-74' },
        { text: '0-49%', value: '0-49' }
      ],
      onFilter: (value, record) => {
        const [min, max] = (value as string).split('-').map(Number);
        const completeness = calculateCompleteness(record);
        return completeness >= min && completeness <= max;
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (text: string) => dayjs(text).format('YYYY-MM-DD HH:mm:ss'),
      sorter: (a, b) => dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix(),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space size="middle">
          <Button type="link" onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Button type="link" danger onClick={() => handleDelete(record.id)}>
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
  const simulateCrawling = (id: string) => {
    // 更新状态为爬虫进行中
    setData(prevData => {
      const newData = prevData.map(item =>
        item.id === id
          ? { ...item, status: 'crawler_running' }
          : item
      );
      localStorage.setItem('products', JSON.stringify(newData));
      return newData;
    });

    // 模拟爬虫完成
    setTimeout(() => {
      setData(prevData => {
        const newData = prevData.map(item => {
          if (item.id === id) {
            const success = Math.random() > 0.3; // 70% 成功率
            const newItem = {
              ...item,
              status: success ? 'crawler_success' : 'crawler_failed',
            };
            // 如果爬虫成功,添加到选品库
            if (success) {
              addSelection({
                ...newItem,
                status: 'pending' // 在选品库中状态为待分配
              });
            }
            return newItem;
          }
          return item;
        });
        localStorage.setItem('products', JSON.stringify(newData));
        return newData;
      });
    }, 3000); // 3秒后完成
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
          columns={columns}
          dataSource={filteredProducts}
          rowKey="id"
          loading={loading}
          rowSelection={{
            selectedRowKeys,
            onChange: (selectedRowKeys) => setSelectedRowKeys(selectedRowKeys),
          }}
          pagination={{
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
          onChange={(pagination, filters, sorter) => {
            // 处理排序
            if (sorter && 'field' in sorter) {
              setSortField(sorter.field as string);
              setSortOrder(sorter.order || undefined);
            }
          }}
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