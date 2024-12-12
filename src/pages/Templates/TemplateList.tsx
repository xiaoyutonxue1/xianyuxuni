import React, { useState } from 'react';
import { Card, Table, Button, Input, Space, Tag, Modal, message } from 'antd';
import { PlusOutlined, CopyOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { Template } from '../../types/template';

const { Search } = Input;

interface TemplateListProps {
  onEdit: (template?: Template) => void;
}

// 示例数据
const mockData: Template[] = [
  {
    id: 1,
    name: '游戏充值模板',
    content: '【${productName}】\n游戏充值说明：\n1. ${instructions}\n2. 充值金额：${amount}元\n3. 到账时间：${deliveryTime}',
    type: 'default',
    storeId: 'store1',
    createdAt: '2024-03-11 10:00:00',
    updatedAt: '2024-03-11 10:00:00',
    variables: [
      { key: 'productName', name: '商品名称', type: 'text', required: true },
      { key: 'instructions', name: '充值说明', type: 'text', required: true },
      { key: 'amount', name: '充值金额', type: 'number', required: true },
      { key: 'deliveryTime', name: '到账时间', type: 'text', required: true },
    ],
  },
  {
    id: 2,
    name: '视频会员模板',
    content: '【${productName}】\n会员开通说明：\n1. ${instructions}\n2. 会员时长：${duration}\n3. 开通方式：${activationMethod}',
    type: 'default',
    storeId: 'store2',
    createdAt: '2024-03-11 11:30:00',
    updatedAt: '2024-03-11 11:30:00',
    variables: [
      { key: 'productName', name: '商品名称', type: 'text', required: true },
      { key: 'instructions', name: '开通说明', type: 'text', required: true },
      { key: 'duration', name: '会员时长', type: 'text', required: true },
      { key: 'activationMethod', name: '开通方式', type: 'text', required: true },
    ],
  },
];

const TemplateList: React.FC<TemplateListProps> = ({ onEdit }) => {
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const columns: ColumnsType<Template> = [
    {
      title: '模板名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type: 'default' | 'custom') => (
        <Tag color={type === 'default' ? 'blue' : 'green'}>
          {type === 'default' ? '默认模板' : '自定义模板'}
        </Tag>
      ),
    },
    {
      title: '变量数量',
      dataIndex: 'variables',
      key: 'variables',
      width: 120,
      render: (variables: Template['variables']) => variables.length,
    },
    {
      title: '所属店铺',
      dataIndex: 'storeId',
      key: 'storeId',
      width: 150,
      render: (storeId: string) => {
        const storeMap: Record<string, string> = {
          store1: '游戏商城1号店',
          store2: '游戏商城2号店',
          store3: '视频会员专营店',
          store4: '音乐会员专营店',
        };
        return storeMap[storeId] || storeId;
      },
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 180,
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_, record: Template) => (
        <Space size="middle">
          <a onClick={() => onEdit(record)}>
            <EditOutlined /> 编辑
          </a>
          <a onClick={() => handleCopy(record)}>
            <CopyOutlined /> 复制
          </a>
          <a onClick={() => handleDelete(record)}>
            <DeleteOutlined /> 删除
          </a>
        </Space>
      ),
    },
  ];

  const handleCopy = (record: Template) => {
    Modal.confirm({
      title: '复制模板',
      content: '确定要复制该模板吗？复制后可以在此基础上修改。',
      onOk() {
        message.success('复制成功');
      },
    });
  };

  const handleDelete = (record: Template) => {
    Modal.confirm({
      title: '删除模板',
      content: '确定要删除该模板吗？删除后不可恢复。',
      onOk() {
        message.success('删除成功');
      },
    });
  };

  const handleAdd = () => {
    onEdit();
  };

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex justify-between">
          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              新增模板
            </Button>
          </Space>
          <Search placeholder="搜索模板" style={{ width: 300 }} />
        </div>
      </Card>

      <Table
        columns={columns}
        dataSource={mockData}
        rowKey="id"
        rowSelection={{
          type: 'checkbox',
          selectedRowKeys,
          onChange: (keys) => setSelectedRowKeys(keys),
        }}
        pagination={{
          total: mockData.length,
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
        }}
      />
    </div>
  );
};

export default TemplateList;