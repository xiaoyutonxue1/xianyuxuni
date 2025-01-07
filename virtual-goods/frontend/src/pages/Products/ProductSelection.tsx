import React, { useState, useMemo } from 'react';
import { Card, Table, Button, Input, Space, Tag, Modal, Form, Select, Alert, Empty, message, Typography, Dropdown } from 'antd';
import { ShopOutlined, EditOutlined, DeleteOutlined, ExportOutlined, DownOutlined } from '@ant-design/icons';
import type { ProductSelection } from '../../types/product';
import { calculateCompleteness } from '../../utils/productCompleteness';
import useProductStore from '../../store/productStore';
import CreateProductForm from './CreateProductForm';

const { Search } = Input;

// 添加完整度筛选选项
const completenessOptions = [
  { label: '全部完整度', value: '' },
  { label: '完整商品', value: 'complete' },
  { label: '不完整商品', value: 'incomplete' },
  { type: 'divider' },
  { label: '缺少商品名称', value: 'missing_name' },
  { label: '缺少商品分类', value: 'missing_category' },
  { label: '缺少公共图片', value: 'missing_images' },
  { label: '缺少售价', value: 'missing_price' },
  { label: '缺少库存', value: 'missing_stock' },
  { label: '缺少发货方式', value: 'missing_delivery_method' },
  { label: '缺少发货信息', value: 'missing_delivery_info' }
];

const ProductSelectionPage: React.FC = () => {
  const { selections: dataSource, loading, updateSelection, addSelection, removeSelection } = useProductStore();
  const [selectedSelection, setSelectedSelection] = useState<ProductSelection | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [completenessFilter, setCompletenessFilter] = useState<string>('');
  const [searchText, setSearchText] = useState('');

  // 修改筛选逻辑
  const filteredData = useMemo(() => {
    let result = [...dataSource];

    // 应用完整度筛选
    if (completenessFilter) {
      switch (completenessFilter) {
        case 'complete':
          result = result.filter(item => calculateCompleteness(item) === 100);
          break;
        case 'incomplete':
          result = result.filter(item => calculateCompleteness(item) < 100);
          break;
        case 'missing_name':
          result = result.filter(item => !item.name);
          break;
        case 'missing_category':
          result = result.filter(item => !item.category);
          break;
        case 'missing_images':
          result = result.filter(item => !item.commonImages?.length);
          break;
        case 'missing_price':
          result = result.filter(item => !item.price);
          break;
        case 'missing_stock':
          result = result.filter(item => !item.stock);
          break;
        case 'missing_delivery_method':
          result = result.filter(item => !item.deliveryMethod);
          break;
        case 'missing_delivery_info':
          result = result.filter(item => !item.deliveryInfo);
          break;
      }
    }

    // 应用搜索筛选
    if (searchText) {
      result = result.filter(item => 
        item.name?.toLowerCase().includes(searchText.toLowerCase()) ||
        item.category?.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    return result;
  }, [dataSource, completenessFilter, searchText]);

  // 渲染编辑弹窗
  const renderEditModal = () => {
    if (!selectedSelection) return null;

    return (
      <Modal
        title="编辑选品"
        open={isEditModalVisible}
        onCancel={() => {
          setIsEditModalVisible(false);
          setSelectedSelection(null);
        }}
        footer={null}
        width={800}
      >
        <CreateProductForm
          mode="edit"
          initialValues={selectedSelection}
          onSubmit={async (values) => {
            try {
              // 更新选品数据
              const updatedSelection = {
                ...selectedSelection,
                ...values,
              };
              updateSelection(updatedSelection);
              setIsEditModalVisible(false);
              setSelectedSelection(null);
              message.success('编辑成功');
            } catch (error) {
              message.error('编辑失败');
            }
          }}
          onCancel={() => {
            setIsEditModalVisible(false);
            setSelectedSelection(null);
          }}
        />
      </Modal>
    );
  };

  // 渲染创建弹窗
  const renderCreateModal = () => {
    return (
      <Modal
        title="新增选品"
        open={isCreateModalVisible}
        onCancel={() => setIsCreateModalVisible(false)}
        footer={null}
        width={800}
      >
        <CreateProductForm
          mode="create"
          onSubmit={async (values) => {
            try {
              // 创建新选品
              const newSelection: ProductSelection = {
                ...values, // 先展开values
                id: Date.now().toString(),
                createdAt: new Date().toISOString(),
                source: values.method as 'manual' | 'crawler', // 使用method字段的值
                hasSpecs: values.hasSpecs ?? false,
                commonImages: values.commonImages || [],
                specs: values.specs || [],
              };
              console.log('Creating new selection:', newSelection); // 添加日志
              addSelection(newSelection);
              setIsCreateModalVisible(false);
              message.success('创建成功');
            } catch (error) {
              message.error('创建失败');
            }
          }}
          onCancel={() => setIsCreateModalVisible(false)}
        />
      </Modal>
    );
  };

  // 处理批量删除
  const handleBatchDelete = () => {
    Modal.confirm({
      title: '确认删除',
      content: `确定删除选中的 ${selectedRowKeys.length} 个选品吗？此操作不可恢复！`,
      okText: '确定',
      cancelText: '取消',
      onOk: () => {
        selectedRowKeys.forEach(id => {
          removeSelection(id);
        });
        setSelectedRowKeys([]);
        message.success('删除成功');
      }
    });
  };

  // 处理单个删除
  const handleDelete = (record: ProductSelection) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定删除这个选品吗？此操作不可恢复！',
      okText: '确定',
      cancelText: '取消',
      onOk: () => {
        removeSelection(record.id);
        message.success('删除成功');
      }
    });
  };

  // 表格列定义
  const columns = [
    {
      title: '商品信息',
      key: 'productInfo',
      render: (_: any, record: ProductSelection) => (
        <Space direction="vertical" size={0}>
          <div className="flex items-center gap-2">
            <span className="font-medium">{record.name}</span>
            <Tag color={record.source === 'manual' ? 'blue' : 'orange'}>
              {record.source === 'manual' ? '手动' : '爬虫'}
            </Tag>
          </div>
          {record.category && <Tag>{record.category}</Tag>}
        </Space>
      ),
    },
    {
      title: '价格/库存',
      key: 'priceAndStock',
      render: (_: any, record: ProductSelection) => (
        <Space direction="vertical" size={0}>
          <span>¥{record.price}</span>
          <span className="text-gray-500">库存: {record.stock}</span>
        </Space>
      ),
    },
    {
      title: '发货方式',
      dataIndex: 'deliveryMethod',
      key: 'deliveryMethod',
    },
    {
      title: '完整度',
      key: 'completeness',
      render: (_: any, record: ProductSelection) => {
        const percent = calculateCompleteness(record);
        let color = 'default';
        if (percent === 100) color = 'success';
        else if (percent >= 80) color = 'processing';
        else if (percent >= 60) color = 'warning';
        else color = 'error';
        
        return (
          <Tag color={color}>
            {percent}%
          </Tag>
        );
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: ProductSelection) => (
        <Space size="middle">
            <Button
              type="link"
            icon={<EditOutlined />}
              onClick={() => {
              setSelectedSelection(record);
              setIsEditModalVisible(true);
            }}
          >
            编辑
          </Button>
          <Button
            type="link"
            danger
            onClick={() => handleDelete(record)}
          >
            删除
            </Button>
        </Space>
      ),
    },
  ];

  // 表格行选择配置
  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => {
      setSelectedRowKeys(keys as string[]);
    }
  };

  return (
    <div className="p-6">
      <Card>
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2">
            <Search
              placeholder="搜索商品"
              style={{ width: 200 }}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onSearch={setSearchText}
            />
            <Select
              placeholder="完整度"
              style={{ width: 160 }}
              value={completenessFilter}
              onChange={setCompletenessFilter}
              allowClear
              options={completenessOptions}
            />
          </div>
          <Space>
            {selectedRowKeys.length > 0 && (
              <Dropdown
                menu={{
                  items: [
    {
      key: 'delete',
      label: '批量删除',
      icon: <DeleteOutlined />,
      onClick: handleBatchDelete,
                      danger: true
    },
    {
      key: 'export',
                      label: '导出数据',
                      icon: <ExportOutlined />
                    }
                  ]
                }}
            >
              <Button>
                  批量操作 ({selectedRowKeys.length}) <DownOutlined />
              </Button>
            </Dropdown>
            )}
            <Button type="primary" onClick={() => setIsCreateModalVisible(true)}>
              新增选品
            </Button>
          </Space>
        </div>

      <Table
          rowSelection={rowSelection}
        columns={columns}
          dataSource={filteredData}
          loading={loading}
        rowKey="id"
        />
      </Card>

      {renderEditModal()}
      {renderCreateModal()}
    </div>
  );
};

export default ProductSelectionPage; 