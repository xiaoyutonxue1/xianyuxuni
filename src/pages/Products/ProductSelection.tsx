import React, { useState } from 'react';
import { Card, Table, Button, Input, Space, Tag, Modal, Form, Select, Alert, Empty, message, Typography, Dropdown } from 'antd';
import { ShopOutlined, DownOutlined, DeleteOutlined, ExportOutlined, EditOutlined } from '@ant-design/icons';
import type { ProductSelection, ProductSelectionStatus, Product } from '../../types/product';
import useSettingsStore from '../../store/settingsStore';
import useProductStore from '../../store/productStore';
import useSelectionStore from '../../store/selectionStore';
import type { ColumnsType } from 'antd/es/table/interface';
import EditSelectionForm from './EditSelectionForm';

const { Search } = Input;
const { Text } = Typography;

// 状态标签配置
const statusConfig: Record<ProductSelectionStatus, { color: string; text: string }> = {
  pending: {
    color: 'gold',
    text: '待分配'
  },
  distributed: {
    color: 'green',
    text: '已分配'
  },
  inactive: {
    color: 'red',
    text: '已下架'
  }
};

// 渲染状态标签
const renderStatusTag = (status: ProductSelectionStatus) => {
  const config = statusConfig[status] || {
    color: 'default',
    text: '未知状态'
  };
  return (
    <Tag color={config.color}>
      {config.text}
    </Tag>
  );
};

const ProductSelectionPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selectedSelections, setSelectedSelections] = useState<ProductSelection[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [form] = Form.useForm();
  const [selectedSelection, setSelectedSelection] = useState<ProductSelection | null>(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  
  // 使用 store
  const { storeAccounts, storeGroups } = useSettingsStore();
  const { addProducts } = useProductStore();
  const { selections, updateSelectionStatus, deleteSelections, updateSelection } = useSelectionStore();

  // 删除选品
  const handleDelete = (record: ProductSelection) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除选品"${record.name}"吗？`,
      okText: '确定',
      cancelText: '取消',
      onOk: async () => {
        try {
          await deleteSelections([record.id]);
          message.success('删除成功');
        } catch (error) {
          message.error('删除失败');
        }
      }
    });
  };

  // 批量删除选品
  const handleBatchDelete = () => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除选中的 ${selectedRowKeys.length} 个选品吗？`,
      okText: '确定',
      cancelText: '取消',
      onOk: async () => {
        try {
          await deleteSelections(selectedRowKeys as string[]);
          message.success('删除成功');
          setSelectedRowKeys([]);
          setSelectedSelections([]);
        } catch (error) {
          message.error('删除失败');
        }
      }
    });
  };

  // 批量导出选品
  const handleBatchExport = () => {
    try {
      // 准备导出数据
      const exportData = selectedSelections.map(selection => ({
        '名称': selection.name,
        '分类': selection.category,
        '价格': selection.price,
        '库存': selection.stock,
        '创建时间': new Date(selection.createdAt).toLocaleString(),
        '状态': selection.status === 'pending' ? '待分配' : '已分配',
        '来源': selection.source === 'manual' ? '手动创建' : '爬虫抓取'
      }));

      // 转换为CSV
      const headers = Object.keys(exportData[0]);
      const csvRows = exportData.map(row => 
        headers.map(header => String(row[header as keyof typeof row])).join(',')
      );
      const csv = [headers.join(','), ...csvRows].join('\n');

      // 创建下载
      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `选品数据_${new Date().toLocaleDateString()}.csv`;
      link.click();
      
      message.success('导出成功');
    } catch (error) {
      message.error('导出失败');
    }
  };

  // 过滤选品数据
  const getFilteredSelections = () => {
    const pendingSelections = selections.filter(s => s.status === 'pending');
    if (!searchText) return pendingSelections;
    
    const searchLower = searchText.toLowerCase();
    return pendingSelections.filter(selection => (
      selection.name.toLowerCase().includes(searchLower) ||
      selection.category?.toLowerCase().includes(searchLower)
    ));
  };

  // 处理分配
  const handleDistribute = async () => {
    try {
      const values = await form.validateFields();
      const { stores } = values;

      // 处理店铺组,展开所有店铺ID
      const selectedStores = (stores as string[]).map((value: string) => {
        if (value.startsWith('group:')) {
          const groupId = value.replace('group:', '');
          const group = storeGroups.find(g => g.id === groupId);
          return group ? group.storeIds : [];
        }
        return value;
      }).flat();

      // 去重
      const uniqueStores = [...new Set(selectedStores)];
      
      // 为每个选中的选品创建商品
      const newProducts: Product[] = [];
      
      // 处理每个选中的选品
      for (const selectionId of selectedRowKeys) {
        const selection = selections.find(s => s.id === String(selectionId));
        if (!selection) continue;

        // 为每个店铺创建商品
        for (const storeId of uniqueStores) {
          const storeAccount = storeAccounts.find(account => account.id === storeId);
          const defaultTemplate = storeAccount?.features.templates?.find(template => template.isDefault);
          
          if (!defaultTemplate) {
            throw new Error(`店铺 ${storeAccount?.name} 未设置默认模板`);
          }

          // 创建新商品
          const newProduct: Product = {
            id: `${selection.id}-${storeId}`,
            name: selection.name,
            category: selection.category,
            description: selection.description || '',
            price: selection.price,
            stock: selection.stock,
            createdAt: selection.createdAt,
            source: selection.source,
            hasSpecs: selection.hasSpecs,
            selectionId: selection.id,
            storeId,
            templateId: defaultTemplate.id,
            status: 'draft',
            distributedAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString(),
            distributedTitle: defaultTemplate.title.replace('{title}', selection.name),
            distributedContent: defaultTemplate.description.replace('{description}', selection.description || ''),
            coverImage: selection.coverImage,
            deliveryMethod: selection.deliveryMethod,
            deliveryInfo: selection.deliveryInfo,
          };
          
          newProducts.push(newProduct);
        }

        // 更新选品状态
        updateSelectionStatus(String(selectionId), 'distributed');
      }

      // 保存商品数据
      addProducts(newProducts);
      
      message.success('分配成功');
      setIsModalVisible(false);
      setSelectedRowKeys([]);
      setSelectedSelections([]);
      form.resetFields();
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message);
      } else {
        message.error('分配失败');
      }
    }
  };

  // 处理编辑
  const handleEdit = (record: ProductSelection) => {
    setSelectedSelection(record);
    setIsEditModalVisible(true);
  };

  // 处理编辑表单提交
  const handleEditSubmit = async (values: Partial<ProductSelection>) => {
    try {
      if (!selectedSelection) {
        throw new Error('缺少选品ID');
      }

      // 更新选品数据
      const updatedSelection: ProductSelection = {
        ...selectedSelection,
        ...values,
      };

      // 使用 updateSelection 更新数据
      updateSelection(updatedSelection);
      message.success('选品更新成功');
      setIsEditModalVisible(false);
      setSelectedSelection(null);
    } catch (error) {
      message.error('操作失败');
    }
  };

  // 编辑弹窗
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
        <EditSelectionForm
          initialValues={selectedSelection}
          onSubmit={handleEditSubmit}
          onCancel={() => {
            setIsEditModalVisible(false);
            setSelectedSelection(null);
          }}
        />
      </Modal>
    );
  };

  const columns: ColumnsType<ProductSelection> = [
    {
      title: '商品信息',
      key: 'productInfo',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record.name}</Text>
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
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text>¥{record.price}</Text>
          <Text type="secondary">库存: {record.stock}</Text>
        </Space>
      ),
    },
    {
      title: '创建方式',
      key: 'source',
      render: (_, record) => (
        <Tag color={record.source === 'manual' ? 'blue' : 'purple'}>
          {record.source === 'manual' ? '手动创建' : '爬虫抓取'}
        </Tag>
      ),
      filters: [
        { text: '手动创建', value: 'manual' },
        { text: '爬虫抓取', value: 'crawler' },
      ],
      onFilter: (value, record) => record.source === value,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      sorter: (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      render: (createdAt: string) => new Date(createdAt).toLocaleString(),
    },
    {
      title: '状态',
      key: 'status',
      render: (_, record) => renderStatusTag(record.status),
      filters: [
        { text: '待分配', value: 'pending' },
        { text: '已分配', value: 'distributed' },
        { text: '已下架', value: 'inactive' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) => (
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
            onClick={() => handleDelete(record)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys: React.Key[], selectedRows: ProductSelection[]) => {
      setSelectedRowKeys(newSelectedRowKeys);
      setSelectedSelections(selectedRows);
    },
  };

  // 批量操作菜单
  const batchOperationItems = [
    {
      key: 'delete',
      label: '批量删除',
      icon: <DeleteOutlined />,
      onClick: handleBatchDelete,
    },
    {
      key: 'export',
      label: '批量导出',
      icon: <ExportOutlined />,
      onClick: handleBatchExport,
    },
  ];

  return (
    <div>
      <Card>
        <div className="flex justify-between items-center mb-4">
          <Space>
            <Search
              placeholder="搜索选品名称或分类"
              onSearch={value => setSearchText(value)}
              onChange={e => setSearchText(e.target.value)}
              allowClear
            />
          </Space>
          <Space>
            <Dropdown
              menu={{
                items: [
                  {
                    key: 'export',
                    label: '导出数据',
                    icon: <ExportOutlined />,
                    onClick: handleBatchExport,
                    disabled: selectedRowKeys.length === 0,
                  },
                  {
                    key: 'delete',
                    label: '批量删除',
                    icon: <DeleteOutlined />,
                    onClick: handleBatchDelete,
                    disabled: selectedRowKeys.length === 0,
                    danger: true,
                  },
                ],
              }}
            >
              <Button>
                批量操作 <DownOutlined />
              </Button>
            </Dropdown>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={getFilteredSelections()}
          rowKey="id"
          rowSelection={{
            selectedRowKeys,
            onChange: (selectedKeys, selectedRows) => {
              setSelectedRowKeys(selectedKeys);
              setSelectedSelections(selectedRows);
            },
          }}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: total => `共 ${total} 条记录`,
          }}
          loading={loading}
        />

        {/* 分配弹窗 */}
        <Modal
          title="分配选品"
          open={isModalVisible}
          onOk={handleDistribute}
          onCancel={() => {
            setIsModalVisible(false);
            form.resetFields();
          }}
          width={600}
        >
          <div className="mb-4">
            <Alert
              message={`已选中 ${selectedSelections.length} 个选品`}
              description="选中的选品将被分配到所选店铺，每个店铺将使用其默认模板创建独立商品。"
              type="info"
              showIcon
            />
          </div>
          <Form form={form} layout="vertical">
            <Form.Item
              name="stores"
              label="选择店铺"
              rules={[{ required: true, message: '请选择至少一个店铺' }]}
            >
              <Select
                mode="multiple"
                placeholder="请选择要分配的店铺"
                style={{ width: '100%' }}
                options={[
                  {
                    label: '店铺组',
                    options: storeGroups.map(group => ({
                      label: `${group.name} (${group.storeIds.length}家店铺)`,
                      value: `group:${group.id}`,
                    })),
                  },
                  {
                    label: '单个店铺',
                    options: storeAccounts.map(account => ({
                      label: `${account.name} (${account.platform})${account.features.templates?.some(t => t.isDefault) ? '' : ' (未设置默认模板)'}`,
                      value: account.id,
                    })),
                  },
                ]}
              />
            </Form.Item>
          </Form>
        </Modal>

        {/* 编辑弹窗 */}
        {renderEditModal()}
      </Card>
    </div>
  );
};

export default ProductSelectionPage; 