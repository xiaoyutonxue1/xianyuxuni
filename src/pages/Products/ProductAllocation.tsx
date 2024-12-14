import React, { useState } from 'react';
import { Card, Table, Button, Input, Space, message, Tag, Modal, Form, Alert, Select, Empty } from 'antd';
import { ShopOutlined } from '@ant-design/icons';
import type { ProductSelection } from '../../types/product';
import useSettingsStore from '../../store/settingsStore';
import useProductStore from '../../store/productStore';
import useSelectionStore from '../../store/selectionStore';
import type { ColumnsType } from 'antd/es/table/interface';

const { Search } = Input;

const ProductAllocation: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [selectedSelections, setSelectedSelections] = useState<ProductSelection[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [form] = Form.useForm();
  
  // 使用 store
  const { storeAccounts, storeGroups } = useSettingsStore();
  const { addProducts, products } = useProductStore();
  const { selections, updateSelectionStatus } = useSelectionStore();

  // 处理分配
  const handleDistribute = async () => {
    try {
      const values = await form.validateFields();
      const { stores } = values;

      // 处理店铺组,展开所有店铺ID
      const selectedStores = stores.map((value: string) => {
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
      const newProducts = [];
      
      // 处理每个选中的选品
      for (const selectionId of selectedRowKeys) {
        const selection = selections.find(s => s.id === selectionId);
        if (!selection) continue;

        // 为每个店铺创建商品
        for (const storeId of uniqueStores) {
          const storeAccount = storeAccounts.find(account => account.id === storeId);
          const defaultTemplate = storeAccount?.features.templates?.find(template => template.isDefault);
          
          if (!defaultTemplate) {
            throw new Error(`店铺 ${storeAccount?.name} 未设置默认模板`);
          }

          // 创建新商品
          const newProduct = {
            ...selection,
            id: `${selection.id}-${storeId}`,
            selectionId: selection.id,
            storeId,
            templateId: defaultTemplate.id,
            status: 'draft',
            distributedAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString(),
            distributedTitle: defaultTemplate.title.replace('{title}', selection.name),
            distributedContent: defaultTemplate.description.replace('{description}', selection.description || '')
          };
          newProducts.push(newProduct);
        }

        // 更新选品状态
        const now = new Date().toISOString();
        updateSelectionStatus(selectionId, 'distributed', now);
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

  // 过滤和搜索选品
  const getFilteredSelections = () => {
    if (!searchText) {
      return selections;
    }

    const searchLower = searchText.toLowerCase();
    return selections.filter(selection => 
      selection.name.toLowerCase().includes(searchLower) ||
      selection.category.toLowerCase().includes(searchLower)
    );
  };

  const columns: ColumnsType<ProductSelection> = [
    {
      title: '商品信息',
      key: 'productInfo',
      render: (_, record: ProductSelection) => (
        <Space direction="vertical" size={0}>
          <Space>
            <span style={{ fontWeight: 'bold' }}>{record.name}</span>
            <Tag>{record.category}</Tag>
          </Space>
          <Space size="small">
            <Tag color="blue">来源: {record.source === 'manual' ? '手动' : '自动'}</Tag>
            {record.completeness && (
              <Tag color={record.completeness >= 100 ? 'success' : 'warning'}>
                完整度: {record.completeness}%
              </Tag>
            )}
          </Space>
          {record.description && (
            <span className="text-gray-500 text-sm">{record.description}</span>
          )}
        </Space>
      ),
    },
    {
      title: '价格/库存',
      key: 'priceAndStock',
      render: (_, record: ProductSelection) => (
        <Space direction="vertical" size={0}>
          <span style={{ fontWeight: 'bold' }}>¥{record.price}</span>
          <span style={{ color: '#666' }}>库存: {record.stock}</span>
        </Space>
      ),
    },
    {
      title: '分配状态',
      key: 'status',
      width: 120,
      render: (_, record: ProductSelection) => {
        const isDistributed = record.status === 'distributed';
        return (
          <Space direction="vertical" size={0}>
            <Tag color={isDistributed ? 'success' : 'blue'}>
              {isDistributed ? '已分配' : '待分配'}
            </Tag>
            {isDistributed && record.distributedAt && (
              <span className="text-gray-500 text-xs">
                {new Date(record.distributedAt).toLocaleString()}
              </span>
            )}
          </Space>
        );
      },
    },
    {
      title: '分配信息',
      key: 'distributionInfo',
      render: (_, record: ProductSelection) => {
        if (record.status !== 'distributed') {
          return <span className="text-gray-400">-</span>;
        }

        // 获取该选品相关的所有商品
        const relatedProducts = products.filter(p => p.selectionId === record.id);
        const storeNames = relatedProducts.map(p => {
          const store = storeAccounts.find(s => s.id === p.storeId);
          return store?.name || p.storeId;
        });

        return (
          <Space direction="vertical" size={0}>
            <span>已分配到 {storeNames.length} 个店铺</span>
            <span className="text-gray-500 text-xs">
              {storeNames.join(', ')}
            </span>
          </Space>
        );
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (time: string) => new Date(time).toLocaleString(),
    }
  ];

  // 表格选择配置
  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedKeys: string[], selectedRows: ProductSelection[]) => {
      setSelectedRowKeys(selectedKeys);
      setSelectedSelections(selectedRows);
    }
  };

  const filteredData = getFilteredSelections();

  return (
    <div className="p-6 space-y-4">
      <Card>
        <div className="flex justify-between items-center mb-4">
          <Button
            type="primary"
            icon={<ShopOutlined />}
            onClick={() => {
              if (selectedRowKeys.length === 0) {
                message.warning('请先选择要分配的选品');
                return;
              }
              setIsModalVisible(true);
            }}
            disabled={selectedRowKeys.length === 0}
          >
            分配选品 {selectedRowKeys.length > 0 && `(${selectedRowKeys.length})`}
          </Button>
          <Search
            placeholder="搜索商品名称/分类"
            style={{ width: 300 }}
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            allowClear
          />
        </div>

        <Table
          columns={columns}
          dataSource={filteredData}
          rowSelection={rowSelection}
          rowKey="id"
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: total => `共 ${total} 条选品`,
          }}
          loading={loading}
          locale={{
            emptyText: <Empty description="暂无选品" />
          }}
        />
      </Card>

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
            message={`已选择 ${selectedSelections.length} 个选品`}
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
    </div>
  );
};

export default ProductAllocation; 