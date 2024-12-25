import React, { useState, useRef, useEffect } from 'react';
import { Card, Table, Button, Input, Space, message, Tag, Tooltip, Modal, Dropdown, Progress, Typography, Select, DatePicker } from 'antd';
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
  SearchOutlined,
  CalendarOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import useSettingsStore from '../../store/settingsStore';
import useSelectionStore from '../../store/selectionStore';
import CreateProductForm from './CreateProductForm';
import EditSelectionForm from './EditSelectionForm';
import { calculateCompleteness, getMissingFields, getCompletenessStatus } from '../../utils/productCompleteness';
import type { TableProps } from 'antd';
import type { ColumnsType, SortOrder } from 'antd/es/table/interface';
import type { ProductSelection, ProductSourceStatus, ProductSelectionStatus } from '../../types/product';
import dayjs, { Dayjs } from 'dayjs';
import ProductFilter from './components/ProductFilter';
import type { RangePickerProps } from 'antd/es/date-picker';
import { deliveryMethods } from '../../utils/constants';
import { formatDate } from '../../utils/date';
import StatusTag from './components/StatusTag';

const { Search } = Input;
const { confirm } = Modal;
const { Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

type RangeValue<T> = [T | null, T | null] | null;

// 商品状态配置
const statusConfig: Record<ProductSourceStatus, { text: string; color: string; icon: React.ReactNode }> = {
  manual: { 
    text: '手动创建', 
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
  }
};

// 从 localStorage 获取数据,如果没有则返回空
const getInitialProducts = () => {
  const savedProducts = localStorage.getItem('products');
  if (savedProducts) {
    return JSON.parse(savedProducts);
  }
  return [];
};

const ProductLibrary: React.FC = () => {
  const navigate = useNavigate();
  const { addSelection, selections, deleteSelections } = useSelectionStore();
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [searchText, setSearchText] = useState('');
  const [filterValues, setFilterValues] = useState<any>({});
  const productSettings = useSettingsStore(state => state.productSettings);
  const confirmModalRef = useRef<any>(null);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [dateRange, setDateRange] = useState<RangeValue<Dayjs>>([null, null]);
  const [filteredData, setFilteredData] = useState<ProductSelection[]>([]);

  // 过滤和搜索商品
  const getFilteredProducts = () => {
    let filteredData = [...selections];
    
    // 按创建时间降序排
    filteredData.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // 搜索过滤
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      filteredData = filteredData.filter(item => 
        item.name.toLowerCase().includes(searchLower) ||
        (item.category && item.category.toLowerCase().includes(searchLower))
      );
    }

    // 应用筛选条件
    if (filterValues.category) {
      filteredData = filteredData.filter(item => 
        item.category === filterValues.category
      );
    }

    if (dateRange && dateRange[0] && dateRange[1]) {
      filteredData = filteredData.filter(item => {
        const createdAt = new Date(item.createdAt);
        return createdAt >= dateRange[0].toDate() && createdAt <= dateRange[1].toDate();
      });
    }

    return filteredData;
  };

  useEffect(() => {
    setFilteredData(getFilteredProducts());
  }, [dateRange, /* other dependencies */]);

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
      icon: <ExclamationCircleOutlined />,
      content: `确定要删除选中的 ${ids.length} 个商品吗？此操作不可恢复！`,
      okText: '确定',
      cancelText: '取消',
      onOk: async () => {
        try {
          setLoading(true);
          await deleteSelections(ids);
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

  // 处理新增
  const handleAdd = () => {
    setIsCreateModalVisible(true);
  };

  // 处理编辑
  const handleEdit = (record: ProductSelection) => {
    setSelectedProduct(record);
    setIsEditModalVisible(true);
  };

  // 处理新增表单提交
  const handleCreateSubmit = async (values: any) => {
    try {
      // 建新的选品记录
      const newSelection: Partial<ProductSelection> & { id: string } = {
        id: Date.now().toString(),
        name: values.name,
        category: values.category,
        description: values.description,
        keywords: values.keywords,
        remark: values.remark,
        price: values.price,
        stock: values.stock,
        createdAt: new Date().toISOString(),
        status: 'pending' as ProductSelectionStatus,
        source: values.method,
        source_status: (values.method === 'manual' ? 'manual' : 'crawler_pending') as ProductSourceStatus,
        hasSpecs: values.hasSpecs,
        specs: values.hasSpecs ? values.specs?.map((spec: any) => ({
          ...spec,
          id: `spec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        })) : undefined,
        deliveryMethod: values.deliveryMethod,
        deliveryInfo: values.deliveryInfo,
        productUrl: values.productUrl,
        coverImage: values.coverImage,
        commonImages: values.commonImages?.map((img: any) => ({
          id: img.id,
          url: img.url,  // 原图 URL
          thumbUrl: img.thumbUrl,  // 缩略图 URL
          type: 'common' as const,
          sort: values.commonImages.indexOf(img),
          createdAt: new Date().toISOString(),
          size: img.size
        }))
      };

      // 添加到选品库
      addSelection(newSelection);

      // 关闭弹窗并提示
      setIsCreateModalVisible(false);
      message.success('选品创建成功');

      // 如果是爬虫模式，显示提示信息
      if (values.method === 'crawler') {
        message.info('爬虫功能开发中，敬请期待');
      }
    } catch (error) {
      message.error('创建失败');
    }
  };

  // 处理编辑表单提交
  const handleEditSubmit = async (values: Partial<ProductSelection>) => {
    try {
      setLoading(true);
      if (!selectedProduct) {
        throw new Error('未选择要编辑的选品');
      }
      // 更新选品数据
      const updatedSelection: ProductSelection = {
        ...selectedProduct,
        ...values,
        commonImages: values.commonImages?.map((img: any) => ({
          id: img.id,
          url: img.url,
          thumbUrl: img.thumbUrl,
          type: 'common' as const,
          sort: values.commonImages?.indexOf(img) ?? 0,
          createdAt: img.createdAt || new Date().toISOString(),
          size: img.size
        })) || [],
        lastUpdated: new Date().toISOString()
      };
      addSelection(updatedSelection);
      message.success('选品更新成功');
      setIsEditModalVisible(false);
      setSelectedProduct(null);
    } catch (error) {
      message.error('操作失败');
    } finally {
      setLoading(false);
    }
  };

  // 表格配置
  const columns: ColumnsType<ProductSelection> = [
    {
      title: '商品信息',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <div className="flex items-start">
          <div className="flex-1 min-w-0">
            <div className="font-medium text-gray-900 truncate">{text}</div>
            <div className="text-sm text-gray-500">
              {record.category}
              {record.source === 'manual' ? (
                <Tag color="blue" className="ml-2">手动</Tag>
              ) : (
                <Tag color="green" className="ml-2">爬虫</Tag>
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: '价格/库存',
      key: 'priceAndStock',
      render: (_, record) => (
        <div>
          <div className="text-gray-900">¥{record.price}</div>
          <div className="text-sm text-gray-500">库存: {record.stock}</div>
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status, record) => (
        <div>
          <StatusTag status={status} source_status={record.source_status} />
        </div>
      ),
    },
    {
      title: (
        <div className="flex items-center space-x-1">
          <span>创建时间</span>
          <Tooltip title="筛选日期范围">
            <CalendarOutlined 
              className="cursor-pointer text-gray-400 hover:text-blue-500"
              onClick={() => setDatePickerOpen(true)}
            />
          </Tooltip>
        </div>
      ),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (date) => (
        <div className="whitespace-nowrap">
          {formatDate(date)}
        </div>
      ),
      sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
    {
      title: '完整度',
      key: 'completeness',
      render: (_, record) => {
        const percent = calculateCompleteness(record);
        const missing = getMissingFields(record);
        return (
          <Tooltip
            title={
              missing.length > 0 ? (
                <div>
                  <div className="font-medium mb-1">未填写项目：</div>
                  {missing.map((field, index) => (
                    <div key={index} className="text-red-400">• {field}</div>
                  ))}
                </div>
              ) : '已完善'
            }
          >
            <Progress
              percent={percent}
              size="small"
              status={percent === 100 ? 'success' : 'active'}
              format={(percent) => `${percent}%`}
            />
          </Tooltip>
        );
      },
    },
    {
      title: '操作',
      key: 'action',
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
  const handleTableChange: TableProps<ProductSelection>['onChange'] = (pagination, filters, sorter) => {
    console.log('Table changed:', { pagination, filters, sorter });
  };

  // 处理筛选
  const handleFilter = (filterValues: any) => {
    setFilterValues(filterValues);
    let filteredData = [...selections];

    // 应用筛选条件
    if (filterValues.category) {
      filteredData = filteredData.filter(item => 
        item.category === filterValues.category
      );
    }

    if (filterValues.status) {
      filteredData = filteredData.filter(item => 
        item.status === filterValues.status
      );
    }

    if (filterValues.source) {
      filteredData = filteredData.filter(item => 
        item.source === filterValues.source
      );
    }

    setFilteredData(filteredData);
  };

  // 模拟爬虫状态变化
  const simulateCrawling = (id: string) => {
    // 更新状态为爬虫进行中
    addSelection({
      id,
      source_status: 'crawler_running' as ProductSourceStatus,
    });
    message.success('选品创建成功，正在进行爬虫...');

    // 模拟爬虫完成
    setTimeout(() => {
      const success = Math.random() > 0.3; // 70% 成功率
      const newStatus = success ? 'crawler_success' : 'crawler_failed';
      addSelection({
        id,
        source_status: newStatus as ProductSourceStatus,
      });
      
      // 如果爬虫成功，更新状态为待分配
      if (success) {
        setTimeout(() => {
          addSelection({
            id,
            status: 'pending' as ProductSelectionStatus,
            source_status: 'crawler_success' as ProductSourceStatus,
          });
          message.success('爬虫完成，选品已进入待分配状态');
        }, 1000);
      } else {
        message.error('爬虫失败，请重试或切换手动模式');
      }
    }, 3000);
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
      key: 'export',
      icon: <ExportOutlined />,
      label: '导出数据'
    }
  ];

  // 处理快捷日期选择
  const handleQuickDateSelect = (type: string) => {
    const now = dayjs();
    let start: Dayjs;
    let end: Dayjs;

    switch (type) {
      case 'today':
        start = now.startOf('day');
        end = now.endOf('day');
        break;
      case 'yesterday':
        start = now.subtract(1, 'day').startOf('day');
        end = now.subtract(1, 'day').endOf('day');
        break;
      case 'thisWeek':
        start = now.startOf('week');
        end = now.endOf('day');
        break;
      case 'lastWeek':
        start = now.subtract(1, 'week').startOf('week');
        end = now.subtract(1, 'week').endOf('week');
        break;
      case 'thisMonth':
        start = now.startOf('month');
        end = now.endOf('day');
        break;
      case 'lastMonth':
        start = now.subtract(1, 'month').startOf('month');
        end = now.subtract(1, 'month').endOf('month');
        break;
      default:
        return;
    }

    setDateRange([start, end]);
  };

  // 处理日期范围变化
  const handleDateRangeChange = (dates: RangeValue<Dayjs> | null) => {
    if (dates && dates[0] && dates[1]) {
      setDateRange(dates);
    }
  };

  // 清除日期筛选
  const handleClearDateFilter = () => {
    setDateRange([null, null]);
    setDatePickerOpen(false);
  };

  // 确认日期筛选
  const handleConfirmDateFilter = () => {
    setDatePickerOpen(false);
  };

  return (
    <div className="p-6">
      <Card>
        <div className="mb-4 flex justify-between items-center">
          <Space>
            <Button type="primary" onClick={handleAdd}>
              + 新增选品
            </Button>
            <Button icon={<RobotOutlined />} onClick={() => message.info('爬虫功能开发中，敬请期待')}>
              批量抓取
            </Button>
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
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              allowClear
            />
          </Space>
        </div>

        <ProductFilter onFilter={handleFilter} />

        <Table
          columns={columns}
          dataSource={getFilteredProducts()}
          rowKey="id"
          loading={loading}
          rowSelection={{
            selectedRowKeys,
            onChange: (selectedRowKeys) => setSelectedRowKeys(selectedRowKeys),
          }}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
          onChange={handleTableChange}
        />
      </Card>

      {/* 日期筛选弹窗 */}
      <Modal
        title="选择日期范围"
        open={datePickerOpen}
        onCancel={() => setDatePickerOpen(false)}
        footer={[
          <Button key="clear" onClick={handleClearDateFilter}>
            清除筛选
          </Button>,
          <Button key="cancel" onClick={() => setDatePickerOpen(false)}>
            取消
          </Button>,
          <Button key="ok" type="primary" onClick={handleConfirmDateFilter}>
            确定
          </Button>,
        ]}
        width={400}
        centered
      >
        <div className="space-y-4">
          <RangePicker
            value={dateRange}
            onChange={handleDateRangeChange}
            style={{ width: '100%' }}
            allowClear
            showTime={{
              format: 'HH:mm',
              defaultValue: [dayjs('00:00:00', 'HH:mm:ss'), dayjs('23:59:59', 'HH:mm:ss')]
            }}
            format="YYYY-MM-DD HH:mm"
          />
          <div>
            <div className="text-gray-500 mb-2">快捷选项：</div>
            <Space wrap size={[8, 8]} className="w-full">
              <Button 
                size="small" 
                type={dateRange?.[0]?.isSame(dayjs().startOf('day'), 'day') ? 'primary' : 'default'}
                onClick={() => handleQuickDateSelect('today')}
              >
                今天
              </Button>
              <Button 
                size="small"
                type={dateRange?.[0]?.isSame(dayjs().subtract(1, 'day').startOf('day'), 'day') ? 'primary' : 'default'}
                onClick={() => handleQuickDateSelect('yesterday')}
              >
                昨天
              </Button>
              <Button 
                size="small"
                type={dateRange?.[0]?.isSame(dayjs().startOf('week'), 'day') ? 'primary' : 'default'}
                onClick={() => handleQuickDateSelect('thisWeek')}
              >
                本周
              </Button>
              <Button 
                size="small"
                type={dateRange?.[0]?.isSame(dayjs().subtract(1, 'week').startOf('week'), 'day') ? 'primary' : 'default'}
                onClick={() => handleQuickDateSelect('lastWeek')}
              >
                上周
              </Button>
              <Button 
                size="small"
                type={dateRange?.[0]?.isSame(dayjs().startOf('month'), 'day') ? 'primary' : 'default'}
                onClick={() => handleQuickDateSelect('thisMonth')}
              >
                本月
              </Button>
              <Button 
                size="small"
                type={dateRange?.[0]?.isSame(dayjs().subtract(1, 'month').startOf('month'), 'day') ? 'primary' : 'default'}
                onClick={() => handleQuickDateSelect('lastMonth')}
              >
                上月
              </Button>
            </Space>
          </div>
        </div>
      </Modal>
      
      {/* 新增选品弹窗 */}
      <Modal
        title="新增选品"
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
        title="编辑选品"
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
          <CreateProductForm
            initialValues={selectedProduct}
            onSubmit={handleEditSubmit}
            onCancel={() => {
              setIsEditModalVisible(false);
              setSelectedProduct(null);
            }}
            mode="edit"
          />
        )}
      </Modal>
    </div>
  );
};

export default ProductLibrary; 