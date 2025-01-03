import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Card, Space, Modal } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useStore } from '../../store';

const ShippingList = () => {
  const navigate = useNavigate();
  const stores = useStore((state) => state.stores);

  const columns = [
    {
      title: 'Store',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Shipping Method',
      dataIndex: ['shippingInfo', 'method'],
      key: 'method',
    },
    {
      title: 'Shipping Address',
      dataIndex: ['shippingInfo', 'address'],
      key: 'address',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            onClick={() => navigate(`/shipping/edit/${record.id}`)}
          >
            Edit
          </Button>
          <Button
            type="link"
            onClick={() => handlePreview(record)}
          >
            View Details
          </Button>
        </Space>
      ),
    },
  ];

  const handlePreview = (store) => {
    Modal.info({
      title: `Shipping Details: ${store.name}`,
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold">Method</h4>
            <p>{store.shippingInfo.method}</p>
          </div>
          <div>
            <h4 className="font-semibold">Address</h4>
            <p>{store.shippingInfo.address}</p>
          </div>
          <div>
            <h4 className="font-semibold">Additional Details</h4>
            <pre className="whitespace-pre-wrap">
              {JSON.stringify(store.shippingInfo.details, null, 2)}
            </pre>
          </div>
        </div>
      ),
      width: 600,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Shipping Settings</h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate('/shipping/new')}
        >
          Add Shipping
        </Button>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={stores}
          rowKey="id"
          pagination={false}
        />
      </Card>
    </div>
  );
};

export default ShippingList;