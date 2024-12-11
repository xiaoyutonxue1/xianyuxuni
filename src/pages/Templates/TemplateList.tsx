import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Tag, Space, Input, Select } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { useStore } from '../../store';
import { Template } from '../../types';

const { Option } = Select;

const TemplateList = () => {
  const navigate = useNavigate();
  const templates = useStore((state) => state.templates);
  const stores = useStore((state) => state.stores);
  const [searchText, setSearchText] = useState('');

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      filteredValue: [searchText],
      onFilter: (value: string, record: Template) =>
        record.name.toLowerCase().includes(value.toLowerCase()),
    },
    {
      title: 'Store',
      dataIndex: 'storeId',
      key: 'storeId',
      render: (storeId: string) => {
        const store = stores.find(s => s.id === storeId);
        return store?.name || 'Unknown Store';
      },
    },
    {
      title: 'Default',
      dataIndex: 'isDefault',
      key: 'isDefault',
      render: (isDefault: boolean) => 
        isDefault ? <Tag color="blue">Default</Tag> : null,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Template) => (
        <Space>
          <Button 
            type="link" 
            onClick={() => navigate(`/templates/edit/${record.id}`)}
          >
            Edit
          </Button>
          <Button 
            type="link"
            onClick={() => handlePreview(record)}
          >
            Preview
          </Button>
        </Space>
      ),
    },
  ];

  const handlePreview = (template: Template) => {
    Modal.info({
      title: `Preview: ${template.name}`,
      content: (
        <div className="mt-4 p-4 border rounded">
          <div dangerouslySetInnerHTML={{ __html: template.content }} />
        </div>
      ),
      width: 720,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Templates</h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate('/templates/new')}
        >
          Add Template
        </Button>
      </div>

      <div className="flex gap-4">
        <Input
          placeholder="Search templates"
          prefix={<SearchOutlined />}
          onChange={(e) => setSearchText(e.target.value)}
          className="max-w-md"
        />
        <Select 
          placeholder="Filter by store" 
          className="w-48"
          allowClear
        >
          {stores.map(store => (
            <Option key={store.id} value={store.id}>
              {store.name}
            </Option>
          ))}
        </Select>
      </div>

      <Table
        columns={columns}
        dataSource={templates}
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />
    </div>
  );
};

export default TemplateList;