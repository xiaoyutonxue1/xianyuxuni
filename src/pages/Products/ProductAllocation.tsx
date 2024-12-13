import React, { useState } from 'react';
import { Card, Table, Button, Input, Space, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

const { Search } = Input;

const ProductAllocation: React.FC = () => {
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
      title: '分配状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
    },
    {
      title: '分配时间',
      dataIndex: 'allocationTime',
      key: 'allocationTime',
      width: 180,
      render: (time: string) => time ? new Date(time).toLocaleString() : '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: () => (
        <Space size="middle">
          <Button type="link" onClick={() => message.info('功能开发中')}>分配</Button>
          <Button type="link" danger onClick={() => message.info('功能开发中')}>取消分配</Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex justify-between mb-4">
          <Button type="primary" icon={<PlusOutlined />} onClick={() => message.info('功能开发中')}>
            批量分配
          </Button>
          <Search
            placeholder="搜索商品"
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
          }}
          loading={loading}
        />
      </Card>
    </div>
  );
};

export default ProductAllocation; 