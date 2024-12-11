import React from 'react';
import { Input } from 'antd';
import type { InputRef } from 'antd';

const { TextArea } = Input;

interface TemplateEditorProps {
  value?: string;
  onChange?: (value: string) => void;
}

const TemplateEditor: React.FC<TemplateEditorProps> = ({ value, onChange }) => {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange?.(e.target.value);
  };

  return (
    <div className="border rounded-md">
      <TextArea
        value={value}
        onChange={handleChange}
        rows={15}
        className="font-mono"
        placeholder="Enter your template content here..."
      />
      <div className="p-2 bg-gray-50 border-t text-sm text-gray-500">
        Available variables: {'{productName}'}, {'{price}'}, {'{description}'}
      </div>
    </div>
  );
};

export default TemplateEditor;