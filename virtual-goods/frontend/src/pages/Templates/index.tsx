import React, { useState } from 'react';
import { Card, Button, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import TemplateList from './TemplateList';
import TemplateForm from './TemplateForm';
import type { Template, TemplateFormValues } from '../../types/template';

interface TemplateListProps {
  templates: Template[];
  loading: boolean;
  onEdit: (template?: Template) => void;
}

const Templates: React.FC = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | undefined>();

  const handleCreateTemplate = async (values: TemplateFormValues) => {
    try {
      const newTemplate: Template = {
        id: Date.now(), // 临时ID，实际应该由后端生成
        name: values.name,
        content: values.content,
        type: values.type,
        storeId: values.storeId,
        variables: values.variables,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      setTemplates([newTemplate, ...templates]);
      message.success('创建成功');
      return true;
    } catch (error) {
      message.error('创建失败');
      return false;
    }
  };

  return (
    <div>
      <Card
        title="模板管理"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setEditingTemplate(undefined)}
          >
            创建模板
          </Button>
        }
      >
        <TemplateList
          templates={templates}
          loading={loading}
          onEdit={setEditingTemplate}
        />
      </Card>

      {editingTemplate !== undefined && (
        <TemplateForm
          initialValues={editingTemplate}
          onSubmit={handleCreateTemplate}
          onCancel={() => setEditingTemplate(undefined)}
        />
      )}
    </div>
  );
};

export default Templates;