import React, { useState } from 'react';
import { Modal } from 'antd';
import TemplateList from './TemplateList';
import TemplateEditor from './TemplateEditor';
import type { Template } from '../../types/template';

const Templates: React.FC = () => {
  const [isEditorVisible, setIsEditorVisible] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<Template | undefined>();

  const handleEdit = (template?: Template) => {
    setCurrentTemplate(template);
    setIsEditorVisible(true);
  };

  const handleSave = (template: Template) => {
    // TODO: 实现保存逻辑
    console.log('Save template:', template);
    setIsEditorVisible(false);
    setCurrentTemplate(undefined);
  };

  return (
    <div className="space-y-4">
      <TemplateList onEdit={handleEdit} />

      <Modal
        title={currentTemplate ? '编辑模板' : '新增模板'}
        open={isEditorVisible}
        onCancel={() => setIsEditorVisible(false)}
        footer={null}
        width={1200}
        destroyOnClose
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