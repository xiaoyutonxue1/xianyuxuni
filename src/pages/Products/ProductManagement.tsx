import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Input, Space, message, Select, Tag, Modal, Image, DatePicker, Popover } from 'antd';
import { PlusOutlined, EditOutlined, StopOutlined, CalendarOutlined } from '@ant-design/icons';
import EditProductForm from './EditProductForm';
import type { Product, ProductSelection, ProductSourceStatus, ProductStatus, ProductCategory } from '../../types/product';
import useProductStore from '../../store/productStore';
import useSettingsStore from '../../store/settingsStore';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';

const { Search } = Input;
const { RangePicker } = DatePicker;

// 将Product类型转换为ProductSelection类型
const convertProductToSelection = (product: Product): ProductSelection => {
  console.log('Converting product to selection:', product);
  return {
    ...product,
    status: 'pending',
    source_status: product.source === 'manual' ? 'manual' : 'crawler_success' as ProductSourceStatus,
  };
};

// 将ProductSelection类型转换为Product类型
const convertSelectionToProduct = (selection: any, originalProduct: Product): Product => {
  return {
    ...originalProduct,
    ...selection,
    lastUpdated: new Date().toISOString(),
  };
};

const ProductManagement: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProductStatus | ''>('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  
  // 使用 store
  const { products, updateProduct, addProducts } = useProductStore();
  const { productSettings } = useSettingsStore();

  // 过滤和搜索商品
  const getFilteredProducts = () => {
    let filteredData = [...products];
    
    // 按创建时间降序排序
    filteredData.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // 搜索过滤
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      filteredData = filteredData.filter(item => 
        item.name.toLowerCase().includes(searchLower) ||
        item.distributedTitle?.toLowerCase().includes(searchLower)
      );
    }

    // 状态筛选
    if (statusFilter) {
      filteredData = filteredData.filter(item => item.status === statusFilter);
    }

    // 分类筛选
    if (categoryFilter) {
      filteredData = filteredData.filter(item => item.category === categoryFilter);
    }

    // 日期范围筛选
    if (dateRange && dateRange[0] && dateRange[1]) {
      filteredData = filteredData.filter(item => {
        const createdAt = dayjs(item.createdAt);
        return createdAt.isAfter(dateRange[0], 'day') && createdAt.isBefore(dateRange[1], 'day');
      });
    }

    return filteredData;
  };

  // 日期快捷选项
  const dateRangePresets: {
    label: string;
    value: [Dayjs, Dayjs];
  }[] = [
    { label: '最近7天', value: [dayjs().subtract(7, 'd'), dayjs()] },
    { label: '最近30天', value: [dayjs().subtract(30, 'd'), dayjs()] },
    { label: '本月', value: [dayjs().startOf('month'), dayjs().endOf('month')] },
    { label: '上月', value: [dayjs().subtract(1, 'month').startOf('month'), dayjs().subtract(1, 'month').endOf('month')] },
  ];

  // 日期筛选内容
  const dateFilterContent = (
    <div style={{ padding: '8px 0' }}>
      <RangePicker
        value={dateRange}
        onChange={(dates) => setDateRange(dates)}
        presets={dateRangePresets}
        allowClear
      />
    </div>
  );

  // 添加测试数据
  useEffect(() => {
    if (products.length === 0) {
      const testProduct: Product = {
        id: '1',
        name: '测试商品',
        category: '电子书' as ProductCategory,
        description: '这是一个测试商品',
        price: 99,
        stock: 100,
        createdAt: new Date().toISOString(),
        source: 'manual',
        hasSpecs: false,
        selectionId: '1',
        storeId: '1',
        templateId: '1',
        status: 'draft',
        distributedAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        distributedTitle: '测试商品标题',
        distributedContent: '测试商品内容',
        coverImage: 'https://example.com/test.jpg'
      };
      addProducts([testProduct]);
    }
  }, [products, addProducts]);

  // 监听products变化
  useEffect(() => {
    console.log('Current products:', products);
  }, [products]);

  // 处理编辑
  const handleEdit = (record: Product) => {
    console.log('Editing product:', record);
    try {
      setSelectedProduct(record);
      setIsEditModalVisible(true);
      console.log('Edit modal should be visible now');
    } catch (error) {
      console.error('Error in handleEdit:', error);
    }
  };

  // 监听Modal和选中商品的变化
  useEffect(() => {
    console.log('Modal visible:', isEditModalVisible);
    console.log('Selected product:', selectedProduct);
    if (isEditModalVisible && selectedProduct) {
      console.log('Converting product to selection:', selectedProduct);
      const selection = convertProductToSelection(selectedProduct);
      console.log('Converted selection:', selection);
    }
  }, [isEditModalVisible, selectedProduct]);

  // 处理编辑提交
  const handleEditSubmit = async (values: any) => {
    try {
      if (!selectedProduct) return;
      
      console.log('Submitting edit with values:', values);
      
      // 将编辑后的数据转换回Product类型
      const updatedProduct = convertSelectionToProduct(values, selectedProduct);
      
      // 更新商品数据
      updateProduct(updatedProduct);
      message.success('编辑成功');
      setIsEditModalVisible(false);
      setSelectedProduct(null);
    } catch (error) {
      console.error('Edit failed:', error);
      message.error('编辑失败');
    }
  };

  // 处理下架
  const handleOffline = (record: Product) => {
    Modal.confirm({
      title: '确认下架',
      content: `确定要下架商品"${record.name}"吗？`,
      onOk: async () => {
        try {
          updateProduct({
            ...record,
            status: 'offline',
            lastUpdated: new Date().toISOString()
          });
          message.success('下架成功');
        } catch (error) {
          message.error('下架失败');
        }
      }
    });
  };

  // 处理新增商品
  const handleAdd = () => {
    const newProduct: Product = {
      id: `new-${Date.now()}`,
      name: '新商品',
      category: '电子书' as ProductCategory,
      description: '',
      price: 0,
      stock: 0,
      createdAt: new Date().toISOString(),
      source: 'manual',
      hasSpecs: false,
      selectionId: `new-${Date.now()}`,
      storeId: '1',
      templateId: '1',
      status: 'draft',
      distributedAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      distributedTitle: '新商品',
      distributedContent: ''
    };
    setSelectedProduct(newProduct);
    setIsEditModalVisible(true);
  };

  const columns: ColumnsType<Product> = [
    {
      title: '商品信息',
      key: 'productInfo',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          {record.distributedTitle && (
            <span className="text-gray-500">{record.distributedTitle}</span>
          )}
          <Space>
            <span className="font-medium">{record.name}</span>
            <Tag>{record.category}</Tag>
          </Space>
        </Space>
      ),
    },
    {
      title: '头图',
      key: 'coverImage',
      width: 120,
      render: (_, record) => (
        record.coverImage ? (
          <Image
            src={record.coverImage}
            alt="商品头图"
            width={80}
            height={80}
            style={{ objectFit: 'cover' }}
          />
        ) : null
      ),
    },
    {
      title: '价格/库存',
      key: 'priceAndStock',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <span className="font-medium">¥{record.price}</span>
          <span className="text-gray-500">库存: {record.stock}</span>
        </Space>
      ),
    },
    {
      title: '状态',
      key: 'status',
      render: (_, record) => {
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
            {record.publishedAt && (
              <span className="text-gray-500 text-xs">
                发布于 {new Date(record.publishedAt).toLocaleDateString()}
              </span>
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
      title: (
        <Space>
          创建时间
          <Popover 
            content={dateFilterContent}
            trigger="click"
            placement="bottom"
            title="选择日期范围"
          >
            <Button
              type="text"
              icon={<CalendarOutlined style={{ color: '#8c8c8c' }} />}
              size="small"
            />
          </Popover>
        </Space>
      ),
      key: 'createdAt',
      render: (_, record) => new Date(record.createdAt).toLocaleString(),
      sorter: (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_, record) => (
        <Space size="middle">
          <Button 
            type="link" 
            onClick={() => handleEdit(record)}
          >
            <EditOutlined />
            编辑
          </Button>
          {record.status !== 'offline' && (
            <Button 
              type="link" 
              danger 
              onClick={() => handleOffline(record)}
            >
              <StopOutlined />
              下架
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex justify-between mb-4">
          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              新增商品
            </Button>
            <Select
              placeholder="商品状态"
              style={{ width: 120 }}
              value={statusFilter}
              onChange={setStatusFilter}
              allowClear
              options={[
                { label: '全部状态', value: '' },
                { label: '草稿', value: 'draft' },
                { label: '待发布', value: 'pending' },
                { label: '已发布', value: 'published' },
                { label: '发布失败', value: 'failed' },
                { label: '已下架', value: 'offline' },
              ]}
            />
            <Select
              placeholder="商品分类"
              style={{ width: 120 }}
              value={categoryFilter}
              onChange={setCategoryFilter}
              allowClear
              options={[
                { label: '全部分类', value: '' },
                ...(productSettings?.categories?.map(category => ({
                  label: category,
                  value: category,
                })) || [])
              ]}
            />
          </Space>
          <Search
            placeholder="搜索商品名称/分发标题"
            style={{ width: 300 }}
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            allowClear
          />
        </div>

        <Table
          columns={columns}
          dataSource={getFilteredProducts()}
          rowKey="id"
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
          loading={loading}
        />
      </Card>
      
      {/* 编辑弹窗 */}
      <Modal
        title="编辑商品"
        open={isEditModalVisible}
        onCancel={() => {
          console.log('Closing modal');
          setIsEditModalVisible(false);
          setSelectedProduct(null);
        }}
        footer={null}
        width={800}
        centered
        destroyOnClose
      >
        {selectedProduct ? (
          <>
            {console.log('Rendering EditProductForm with product:', selectedProduct)}
            <EditProductForm
              initialValues={convertProductToSelection(selectedProduct)}
              onSubmit={handleEditSubmit}
              onCancel={() => {
                console.log('Canceling edit');
                setIsEditModalVisible(false);
                setSelectedProduct(null);
              }}
            />
          </>
        ) : (
          <div>No product selected</div>
        )}
      </Modal>
    </div>
  );
};

export default ProductManagement; 