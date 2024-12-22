import React, { useState } from 'react';
import { Card, Table, Button, Input, Space, message, Tag, Modal, Form, Alert, Select, Empty, Dropdown, DatePicker } from 'antd';
import { ShopOutlined, DownOutlined, DeleteOutlined, ExportOutlined, CalendarOutlined } from '@ant-design/icons';
import type { ProductSelection } from '../../types/product';
import useSettingsStore from '../../store/settingsStore';
import useProductStore from '../../store/productStore';
import useSelectionStore from '../../store/selectionStore';
import type { ColumnsType } from 'antd/es/table/interface';
import dayjs from 'dayjs';

const { Search } = Input;

const ProductAllocation: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [selectedSelections, setSelectedSelections] = useState<ProductSelection[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [form] = Form.useForm();
  const [filterValues, setFilterValues] = useState({
    storeId: '',
    dateRange: [dayjs().startOf('day'), dayjs().endOf('day')]
  });
  
  // 使用 store
  const { storeAccounts, storeGroups } = useSettingsStore();
  const { addProducts, products, removeProduct } = useProductStore();
  const { selections, updateSelectionStatus, deleteSelections } = useSelectionStore();

  // 批量删除选品
  const handleBatchDelete = () => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除选中的 ${selectedRowKeys.length} 个选品吗？`,
      okText: '确定',
      cancelText: '取消',
      onOk: async () => {
        try {
          await deleteSelections(selectedRowKeys);
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
      const exportData = selectedSelections.map(selection => {
        // 获取该选品相关的所有商品
        const relatedProducts = products.filter(p => p.selectionId === selection.id);
        const storeNames = relatedProducts.map(p => {
          const store = storeAccounts.find(s => s.id === p.storeId);
          return store?.name || p.storeId;
        });

        return {
          名称: selection.name,
          分类: selection.category,
          价格: selection.price,
          库存: selection.stock,
          创建时间: new Date(selection.createdAt).toLocaleString(),
          状态: selection.status === 'pending' ? '待分配' : '已分配',
          分配店铺: storeNames.join(', '),
          来源: selection.source === 'manual' ? '手动创建' : '爬虫抓取'
        };
      });

      // 转换为CSV
      const headers = Object.keys(exportData[0]);
      const csvContent = [
        headers.join(','),
        ...exportData.map(row => 
          headers.map(header => {
            const value = row[header as keyof typeof row];
            return typeof value === 'string' && value.includes(',') 
              ? `"${value}"`
              : value;
          }).join(',')
        )
      ].join('\n');

      // 创建下载
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `选品分配数据_${new Date().toLocaleDateString()}.csv`;
      link.click();
      
      message.success('导出成功');
    } catch (error) {
      message.error('导出失败');
    }
  };

  // 过滤和搜索选品
  const getFilteredSelections = () => {
    let filteredData = [...selections];
    
    // 按创建时间降序排序
    filteredData.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // 搜索过滤
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      filteredData = filteredData.filter(selection => 
        selection.name.toLowerCase().includes(searchLower) ||
        selection.category.toLowerCase().includes(searchLower)
      );
    }

    // 店铺筛选
    if (filterValues.storeId) {
      filteredData = filteredData.filter(selection => {
        const distributedStoreIds = getDistributedStoreIds(selection.id);
        return distributedStoreIds.includes(filterValues.storeId);
      });
    }

    // 日期范围筛选
    if (filterValues.dateRange) {
      const [startDate, endDate] = filterValues.dateRange;
      filteredData = filteredData.filter(selection => {
        const createdAt = dayjs(selection.createdAt);
        return createdAt.isAfter(startDate) && createdAt.isBefore(endDate.endOf('day'));
      });
    }

    return filteredData;
  };

  // 获取选品已分配的店铺ID列表
  const getDistributedStoreIds = (selectionId: string) => {
    return products
      .filter(p => p.selectionId === selectionId)
      .map(p => p.storeId);
  };

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
      let totalRemoved = 0;
      let totalAdded = 0;
      
      for (const selectionId of selectedRowKeys) {
        const selection = selections.find(s => s.id === selectionId);
        if (!selection) continue;

        // 获取已分配的店铺ID列表
        const distributedStoreIds = getDistributedStoreIds(selectionId);

        // 找出被删除的店铺
        const removedStoreIds = distributedStoreIds.filter(storeId => !uniqueStores.includes(storeId));

        // 删除被移除店铺的商品数据
        for (const storeId of removedStoreIds) {
          const productId = `${selectionId}-${storeId}`;
          removeProduct(productId);
        }
        totalRemoved += removedStoreIds.length;

        // 只为未分配的店铺创建商品
        const newStoreIds = uniqueStores.filter(storeId => !distributedStoreIds.includes(storeId));
        totalAdded += newStoreIds.length;

        // 为每个新店铺创建商品
        for (const storeId of newStoreIds) {
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
      if (newProducts.length > 0) {
        addProducts(newProducts);
        message.success(`成功分配到 ${newProducts.length} 个新店铺`);
      } else {
        message.info('所选店铺已全部分配过，请选择其他店铺');
      }
      
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

  // 处理单个选品分配
  const handleSingleDistribute = (record: ProductSelection) => {
    setSelectedRowKeys([record.id]);
    setSelectedSelections([record]);

    // 获取已分配的店铺ID列表
    const distributedStoreIds = getDistributedStoreIds(record.id);
    
    // 获取已分配的店铺组ID列表
    const distributedGroupIds = storeGroups
      .filter(group => {
        // 如果组内的所有店铺都已分配，则选中该组
        const groupStoreIds = new Set(group.storeIds);
        const distributedIds = new Set(distributedStoreIds);
        return group.storeIds.every(id => distributedIds.has(id));
      })
      .map(group => `group:${group.id}`);

    // 设置单的初始值，包括已分配的店铺和店铺组
    form.setFieldsValue({
      stores: [...distributedStoreIds, ...distributedGroupIds]
    });

    setIsModalVisible(true);
  };

  // 表格列配置
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
      filters: [
        { text: '待分配', value: 'pending' },
        { text: '已分配', value: 'distributed' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: '分配信息',
      key: 'distributionInfo',
      render: (_, record: ProductSelection) => {
        // 获取该选品相关的所有商品
        const relatedProducts = products.filter(p => p.selectionId === record.id);
        const storeNames = relatedProducts.map(p => {
          const store = storeAccounts.find(s => s.id === p.storeId);
          return store?.name || p.storeId;
        });

        return (
          <Space direction="vertical" size={0}>
            {storeNames.length > 0 ? (
              <>
                <span>已分配到 {storeNames.length} 个店铺</span>
                <span className="text-gray-500 text-xs">
                  {storeNames.join(', ')}
                </span>
              </>
            ) : (
              <span className="text-gray-400">未分配</span>
            )}
          </Space>
        );
      },
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <div style={{ padding: 8 }}>
          <Select
            style={{ width: 200, marginBottom: 8 }}
            placeholder="选择店铺筛选"
            value={selectedKeys[0]}
            onChange={value => {
              setSelectedKeys(value ? [value] : []);
              confirm();
            }}
            allowClear
            options={storeAccounts.map(store => ({
              label: store.name,
              value: store.id
            }))}
          />
        </div>
      ),
      filterIcon: filtered => (
        <ShopOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      sorter: (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      render: (time: string) => new Date(time).toLocaleString(),
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <div style={{ padding: 8 }}>
          <DatePicker.RangePicker
            style={{ marginBottom: 8 }}
            value={selectedKeys[0]}
            onChange={dates => {
              setSelectedKeys(dates ? [dates] : []);
              confirm();
            }}
          />
        </div>
      ),
      filterIcon: filtered => (
        <CalendarOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Button 
          type="link" 
          icon={<ShopOutlined />}
          onClick={() => handleSingleDistribute(record)}
          disabled={record.status === 'inactive'}
        >
          分配
        </Button>
      ),
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
    <div className="p-6 space-y-4">
      <Card>
        <div className="flex justify-between items-center mb-4">
          <Space>
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
              批量分配 {selectedRowKeys.length > 0 && `(${selectedRowKeys.length})`}
            </Button>
            <Dropdown 
              menu={{ items: batchOperationItems }} 
              disabled={selectedRowKeys.length === 0}
            >
              <Button>
                <Space>
                  批量操作
                  <DownOutlined />
                </Space>
              </Button>
            </Dropdown>
          </Space>
          <Space>
            <DatePicker.RangePicker
              onChange={(dates) => {
                setFilterValues(prev => ({
                  ...prev,
                  dateRange: dates || [dayjs().startOf('day'), dayjs().endOf('day')]
                }));
              }}
              allowClear
              placeholder={['开始日期', '结束日期']}
              ranges={{
                '今天': [dayjs().startOf('day'), dayjs().endOf('day')],
                '昨天': [dayjs().subtract(1, 'day').startOf('day'), dayjs().subtract(1, 'day').endOf('day')],
                '近三天': [dayjs().subtract(2, 'day').startOf('day'), dayjs().endOf('day')],
                '近七天': [dayjs().subtract(6, 'day').startOf('day'), dayjs().endOf('day')],
                '近十五天': [dayjs().subtract(14, 'day').startOf('day'), dayjs().endOf('day')],
                '近一个月': [dayjs().subtract(29, 'day').startOf('day'), dayjs().endOf('day')],
                '近三个月': [dayjs().subtract(89, 'day').startOf('day'), dayjs().endOf('day')],
                '近半年': [dayjs().subtract(179, 'day').startOf('day'), dayjs().endOf('day')],
                '近一年': [dayjs().subtract(364, 'day').startOf('day'), dayjs().endOf('day')],
                '全部': [dayjs('2000-01-01').startOf('day'), dayjs().endOf('day')],
                '本月': [dayjs().startOf('month'), dayjs().endOf('day')],
                '上个月': [dayjs().subtract(1, 'month').startOf('month'), dayjs().subtract(1, 'month').endOf('month')],
              }}
            />
            <Select
              style={{ width: 200 }}
              placeholder="按店铺筛选"
              allowClear
              onChange={(value) => {
                setFilterValues(prev => ({
                  ...prev,
                  storeId: value || ''
                }));
              }}
              options={[
                { label: '全部店铺', value: '' },
                ...storeAccounts.map(store => ({
                  label: store.name,
                  value: store.id
                }))
              ]}
            />
            <Search
              placeholder="搜索商品名称/分类"
              style={{ width: 300 }}
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              allowClear
            />
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={getFilteredSelections()}
          rowKey="id"
          rowSelection={{
            selectedRowKeys,
            onChange: (selectedKeys: string[], selectedRows: ProductSelection[]) => {
              setSelectedRowKeys(selectedKeys);
              setSelectedSelections(selectedRows);
            },
            getCheckboxProps: (record: ProductSelection) => ({
              disabled: record.status === 'inactive' // 只禁用已下架的选品
            })
          }}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: total => `共 ${total} 条记录`,
          }}
          loading={loading}
        />
      </Card>

      <Modal
        title={selectedSelections.length > 1 ? "批量分配选品" : "分配选品"}
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
            description={
              <>
                <p>选中的选品将被分配到所选店铺，每个店铺将使用其默认模板创建独立商品。</p>
                <p className="text-gray-500">注：如果选品已分配过的店铺会被自动跳过</p>
                <p className="text-red-500">警告：取消店铺分配将同时删除该店铺对应的商品数据</p>
                {selectedSelections.length === 1 && (
                  <p className="text-blue-500">已自动选中当前已分配的店铺，取消勾选将删除对应商品</p>
                )}
              </>
            }
            type="warning"
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
                    disabled: account.features.templates?.every(t => !t.isDefault), // 如果没有默认模板则禁用
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