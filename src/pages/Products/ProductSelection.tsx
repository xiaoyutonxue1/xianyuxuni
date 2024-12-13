import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Input, Space, message, Tag, Modal, Form, Alert, Select } from 'antd';
import { PlusOutlined, ShopOutlined } from '@ant-design/icons';
import type { Product } from '../../types/product';
import useSettingsStore from '../../store/settingsStore';
import type { TableProps } from 'antd';
import type { ColumnsType } from 'antd/es/table/interface';

const { Search } = Input;

const ProductSelection: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const { storeAccounts, storeGroups } = useSettingsStore();

  // 获取商品列表
  const fetchProducts = async () => {
    try {
      setLoading(true);
      // TODO: 替换为实际的API调用
      const mockData = [
        {
          id: '1',
          name: '示例商品1',
          category: 'study' as const,
          price: 99.99,
          stock: 100,
          status: 'manual' as const,
          createdAt: new Date().toISOString(),
          store: '默认店铺',
          description: '示例描述',
          source: 'manual' as const,
          hasSpecs: false,
        },
        // ... 更多模拟数据
      ];
      setData(mockData);
      setTotal(mockData.length);
    } catch (error) {
      message.error('获取商品列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // 处理发布
  const handlePublish = async () => {
    try {
      const values = await form.validateFields();
      const { stores, templateId } = values;

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
      
      // 更新选中商品的分配信息
      const updatedProducts = data.map(product => {
        if (selectedRowKeys.includes(product.id)) {
          return {
            ...product,
            distributeInfo: uniqueStores.map(storeId => ({
              storeId,
              templateId,
              status: 'pending' as const,
              distributedAt: new Date().toISOString(),
            }))
          };
        }
        return product;
      });

      setData(updatedProducts);
      message.success('商品发布成功');
      setIsModalVisible(false);
      setSelectedRowKeys([]);
      setSelectedProducts([]);
      form.resetFields();
    } catch (error) {
      message.error('发布失败');
    }
  };

  const columns: ColumnsType<Product> = [
    {
      title: '商品名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
    },
    {
      title: '价格',
      dataIndex: 'price',
      key: 'price',
      render: (price: number) => `¥${price}`,
    },
    {
      title: '库存',
      dataIndex: 'stock',
      key: 'stock',
    },
    {
      title: '发布状态',
      key: 'distributeStatus',
      render: (_, record: Product) => {
        if (!record.distributeInfo?.length) return '-';
        return (
          <Space>
            {record.distributeInfo.map((info, index) => {
              const statusMap = {
                draft: { color: 'default', text: '草稿' },
                pending: { color: 'processing', text: '待发布' },
                published: { color: 'success', text: '已发布' },
                failed: { color: 'error', text: '发布失败' },
                offline: { color: 'default', text: '已下架' },
              };
              const { color, text } = statusMap[info.status];
              const store = storeAccounts.find(s => s.id === info.storeId);
              return (
                <Tag key={index} color={color}>
                  {store?.name}: {text}
                </Tag>
              );
            })}
          </Space>
        );
      },
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys: React.Key[], selectedRows: Product[]) => {
      setSelectedRowKeys(newSelectedRowKeys);
      setSelectedProducts(selectedRows);
    },
  };

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex justify-between">
          <Space>
            <Button
              type="primary"
              icon={<ShopOutlined />}
              onClick={() => {
                if (selectedRowKeys.length === 0) {
                  message.warning('请先选择要发布的商品');
                  return;
                }
                setIsModalVisible(true);
              }}
            >
              发布商品
            </Button>
          </Space>
          <Search
            placeholder="搜索商品"
            style={{ width: 300 }}
            onSearch={value => console.log(value)}
          />
        </div>
      </Card>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        rowSelection={rowSelection}
        pagination={{
          total,
          showSizeChanger: true,
          showQuickJumper: true,
        }}
        loading={loading}
      />

      <Modal
        title="发布商品"
        open={isModalVisible}
        onOk={handlePublish}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        width={600}
      >
        <div className="mb-4">
          <Alert
            message={`已选择 ${selectedProducts.length} 个商品`}
            description="选中的商品将被发布到所选店铺,每个店铺将创建一个独立商品。"
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
              placeholder="请选择要发布的店铺"
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
                    label: `${account.name} (${account.platform})`,
                    value: account.id,
                  })),
                },
              ]}
            />
          </Form.Item>

          <Form.Item
            name="templateId"
            label="选择模板"
            rules={[{ required: true, message: '请选择模板' }]}
          >
            <Select placeholder="请选择模板">
              {storeAccounts[0]?.productTemplates?.map(template => (
                <Select.Option key={template.id} value={template.id}>
                  {template.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ProductSelection; 