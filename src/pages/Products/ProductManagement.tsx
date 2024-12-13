import React, { useState } from 'react';
import { Card, Table, Button, Input, Space, message, Select, Tag } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

const { Search } = Input;

const ProductManagement: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);

  const columns = [
    {
      title: '商品名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 120,
    },
    {
      title: '价格',
      dataIndex: 'price',
      key: 'price',
      width: 100,
      render: (price: number) => `￥${price?.toFixed(2) || '暂无价格'}`,
    },
    {
      title: '库存',
      dataIndex: 'stock',
      key: 'stock',
      width: 100,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const statusMap = {
          draft: { text: '草稿', color: 'default' },
          pending: { text: '待审核', color: 'warning' },
          approved: { text: '已通过', color: 'success' },
          rejected: { text: '已拒绝', color: 'error' },
        };
        const { text, color } = statusMap[status as keyof typeof statusMap] || { text: '未知', color: 'default' };
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (time: string) => time ? new Date(time).toLocaleString() : '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: () => (
        <Space size="middle">
          <Button type="link" onClick={() => message.info('功能开发中')}>编辑</Button>
          <Button type="link" onClick={() => message.info('功能开发中')}>上架</Button>
          <Button type="link" danger onClick={() => message.info('功能开发中')}>删除</Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex justify-between mb-4">
          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => message.info('功能开发中')}>
              新增商品
            </Button>
            <Select
              placeholder="商品状态"
              style={{ width: 120 }}
              options={[
                { label: '全部状态', value: '' },
                { label: '草稿', value: 'draft' },
                { label: '待审核', value: 'pending' },
                { label: '已通过', value: 'approved' },
                { label: '已拒绝', value: 'rejected' },
              ]}
            />
            <Select
              placeholder="商品分类"
              style={{ width: 120 }}
              options={[
                { label: '全部分类', value: '' },
              ]}
            />
          </Space>
          <Search
            placeholder="搜索商品名称"
            style={{ width: 300 }}
            onSearch={() => message.info('功能开发中')}
          />
        </div>

        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
          loading={loading}
        />
      </Card>
    </div>
  );
};

export default ProductManagement; 