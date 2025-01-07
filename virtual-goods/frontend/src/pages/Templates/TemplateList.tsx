import React from 'react';
import { Table, Button, Space } from 'antd';
import type { Template } from '../../types/template';

export interface TemplateListProps {
  templates: Template[];
  loading: boolean;
  onEdit: (template?: Template) => void;
}

const TemplateList: React.FC<TemplateListProps> = ({
  templates,
  loading,
  onEdit
}) => {
  const columns = [
    {
      title: '模板名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => type === 'default' ? '默认模板' : '自定义模板',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (time: string) => new Date(time).toLocaleString(),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record: Template) => (
        <Space>
          <Button type="link" onClick={() => onEdit(record)}>
            编辑
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={templates}
      rowKey="id"
      loading={loading}
    />
  );
};

export default TemplateList;