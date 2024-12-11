import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Tag, Space, Input } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { useStore } from '../../store';
import { formatDate } from '../../utils/date';
import { Product } from '../../types';

const ProductList = () => {
  const navigate = useNavigate();
  const products = useStore((state) => state.products);
  const [searchText, setSearchText] = useState('');

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      filteredValue: [searchText],
      onFilter: (value: string, record: Product) =>
        record.name.toLowerCase().includes(value.toLowerCase()),
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
    },
    {
      title: 'Store',
      dataIndex: 'store',
      key: 'store',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colors = {
          selling: 'success',
          pending: 'warning',
          draft: 'default',
        };
        return <Tag color={colors[status]}>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Last Updated',
      dataIndex: 'lastUpdated',
      key: 'lastUpdated',
      render: (date: string) => formatDate(date),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Product) => (
        <Space>
          <Button type="link" onClick={() => navigate(`/products/edit/${record.id}`)}>
            Edit
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Products</h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate('/products/new')}
        >
          Add Product
        </Button>
      </div>

      <Input
        placeholder="Search products"
        prefix={<SearchOutlined />}
        onChange={(e) => setSearchText(e.target.value)}
        className="max-w-md"
      />

      <Table
        columns={columns}
        dataSource={products}
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />
    </div>
  );
};

export default ProductList;