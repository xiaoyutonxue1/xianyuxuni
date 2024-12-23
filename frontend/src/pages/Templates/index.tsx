import React, { useState } from 'react';
import { Modal, message } from 'antd';
import TemplateList from './TemplateList';
import TemplateEditor from './TemplateEditor';
import type { Template } from '../../types/template';

const Templates: React.FC = () => {
  const [isEditorVisible, setIsEditorVisible] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<Template | undefined>();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);

  const handleEdit = (template?: Template) => {
    setCurrentTemplate(template);
    setIsEditorVisible(true);
  };

  const handleSave = async (template: Template) => {
    try {
      setLoading(true);
      if (currentTemplate) {
        // 更新模板
        const updatedTemplate = {
          ...template,
          updatedAt: new Date().toISOString()
        };
        setTemplates(templates.map(t => 
          t.id === template.id ? updatedTemplate : t
        ));
        message.success('模板更新成功');
      } else {
        // 新增模板
        const newTemplate = {
          ...template,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        setTemplates([newTemplate, ...templates]);
        message.success('模板添加成功');
      }
      setIsEditorVisible(false);
      setCurrentTemplate(undefined);
    } catch (error) {
      message.error('操作失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <TemplateList 
        templates={templates}
        loading={loading}
        onEdit={handleEdit}
      />

      <Modal
        title={currentTemplate ? '编辑模板' : '新增模板'}
        open={isEditorVisible}
        onCancel={() => setIsEditorVisible(false)}
        footer={null}
        width={1200}
        destroyOnClose
        confirmLoading={loading}
      >
        <TemplateEditor
          template={currentTemplate}
          onSave={handleSave}
          onCancel={() => setIsEditorVisible(false)}
        />
      </Modal>
    </div>
  );
};

export default Templates;