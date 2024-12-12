import React, { useState } from 'react';
import { Card, Form, Input, Button, Select, Space, Table, Modal, message, Divider, Tag, Checkbox } from 'antd';
import { PlusOutlined, EyeOutlined, SaveOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { Template, TemplateVariable } from '../../types/template';

const { TextArea } = Input;

interface TemplateEditorProps {
  template?: Template;
  onSave: (values: Template) => void;
  onCancel: () => void;
}

const TemplateEditor: React.FC<TemplateEditorProps> = ({
  template,
  onSave,
  onCancel,
}) => {
  const [form] = Form.useForm();
  const [variables, setVariables] = useState<TemplateVariable[]>(
    template?.variables || []
  );
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewContent, setPreviewContent] = useState('');

  const columns: ColumnsType<TemplateVariable> = [
    {
      title: '变量名称',
      dataIndex: 'name',
      key: 'name',
      width: 150,
    },
    {
      title: '变量标识',
      dataIndex: 'key',
      key: 'key',
      width: 150,
      render: (key: string) => <Tag color="blue">${'{' + key + '}'}</Tag>,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type: string) => {
        const typeMap: Record<string, { color: string; text: string }> = {
          text: { color: 'green', text: '文本' },
          number: { color: 'blue', text: '数字' },
          image: { color: 'purple', text: '图片' },
          list: { color: 'orange', text: '列表' },
        };
        const { color, text } = typeMap[type];
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: '是否必填',
      dataIndex: 'required',
      key: 'required',
      width: 100,
      render: (required: boolean) =>
        required ? (
          <Tag color="red">必填</Tag>
        ) : (
          <Tag color="default">选填</Tag>
        ),
    },
    {
      title: '默认值',
      dataIndex: 'defaultValue',
      key: 'defaultValue',
      width: 150,
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record, index) => (
        <Space>
          <a onClick={() => handleEditVariable(index)}>编辑</a>
          <a onClick={() => handleDeleteVariable(index)}>删除</a>
        </Space>
      ),
    },
  ];

  const handleAddVariable = () => {
    Modal.confirm({
      title: '添加变量',
      content: (
        <Form layout="vertical">
          <Form.Item
            label="变量名称"
            name="name"
            rules={[{ required: true, message: '请输入变量名称' }]}
          >
            <Input placeholder="例如：商品名称" />
          </Form.Item>
          <Form.Item
            label="变量标识"
            name="key"
            rules={[{ required: true, message: '请输入变量标识' }]}
          >
            <Input placeholder="例如：productName" />
          </Form.Item>
          <Form.Item
            label="类型"
            name="type"
            rules={[{ required: true, message: '请选择变量类型' }]}
          >
            <Select>
              <Select.Option value="text">文本</Select.Option>
              <Select.Option value="number">数字</Select.Option>
              <Select.Option value="image">图片</Select.Option>
              <Select.Option value="list">列表</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            label="默认值"
            name="defaultValue"
          >
            <Input placeholder="请输入默认值" />
          </Form.Item>
          <Form.Item
            name="required"
            valuePropName="checked"
          >
            <Checkbox>必填</Checkbox>
          </Form.Item>
        </Form>
      ),
      onOk: () => {
        // TODO: 添加变量逻辑
        message.success('添加成功');
      },
    });
  };

  const handleEditVariable = (index: number) => {
    const variable = variables[index];
    Modal.confirm({
      title: '编辑变量',
      content: (
        <Form
          layout="vertical"
          initialValues={variable}
        >
          <Form.Item
            label="变量名称"
            name="name"
            rules={[{ required: true, message: '请输入变量名称' }]}
          >
            <Input placeholder="例如：商品名称" />
          </Form.Item>
          <Form.Item
            label="变量标识"
            name="key"
            rules={[{ required: true, message: '请输入变量标识' }]}
          >
            <Input placeholder="例如：productName" />
          </Form.Item>
          <Form.Item
            label="类型"
            name="type"
            rules={[{ required: true, message: '请选择变量类型' }]}
          >
            <Select>
              <Select.Option value="text">文本</Select.Option>
              <Select.Option value="number">数字</Select.Option>
              <Select.Option value="image">图片</Select.Option>
              <Select.Option value="list">列表</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            label="默认值"
            name="defaultValue"
          >
            <Input placeholder="请输入默认值" />
          </Form.Item>
          <Form.Item
            name="required"
            valuePropName="checked"
          >
            <Checkbox>必填</Checkbox>
          </Form.Item>
        </Form>
      ),
      onOk: () => {
        // TODO: 编辑变量逻辑
        message.success('修改成功');
      },
    });
  };

  const handleDeleteVariable = (index: number) => {
    Modal.confirm({
      title: '删除变量',
      content: '确定要删除该变量吗？删除后不可恢复。',
      onOk: () => {
        const newVariables = [...variables];
        newVariables.splice(index, 1);
        setVariables(newVariables);
        message.success('删除成功');
      },
    });
  };

  const handlePreview = () => {
    const content = form.getFieldValue('content');
    const previewData: Record<string, string> = {};
    variables.forEach(variable => {
      previewData[variable.key] = variable.defaultValue || `[${variable.name}]`;
    });

    let previewText = content;
    Object.entries(previewData).forEach(([key, value]) => {
      previewText = previewText.replace(
        new RegExp('\\${' + key + '}', 'g'),
        value
      );
    });

    setPreviewContent(previewText);
    setPreviewVisible(true);
  };

  const handleSave = () => {
    form.validateFields().then(values => {
      onSave({
        ...template,
        ...values,
        variables,
        updatedAt: new Date().toISOString(),
      });
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <Form
          form={form}
          layout="vertical"
          initialValues={template}
        >
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="name"
              label="模板名称"
              rules={[{ required: true, message: '请输入模板名称' }]}
            >
              <Input placeholder="请输入模板名称" />
            </Form.Item>
            <Form.Item
              name="storeId"
              label="所属店铺"
              rules={[{ required: true, message: '请选择所属店铺' }]}
            >
              <Select placeholder="请选择所属店铺">
                <Select.Option value="store1">游戏商城1号店</Select.Option>
                <Select.Option value="store2">游戏商城2号店</Select.Option>
                <Select.Option value="store3">视频会员专营店</Select.Option>
                <Select.Option value="store4">音乐会员专营店</Select.Option>
              </Select>
            </Form.Item>
          </div>
          <Form.Item
            name="content"
            label="模板内容"
            rules={[{ required: true, message: '请输入模板内容' }]}
          >
            <TextArea
              rows={6}
              placeholder="请输入模板内容，使用${变量名}插入变量"
            />
          </Form.Item>
        </Form>
      </Card>

      <Card title="变量管理">
        <div className="mb-4">
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAddVariable}>
            添加变量
          </Button>
        </div>
        <Table
          columns={columns}
          dataSource={variables}
          rowKey="key"
          pagination={false}
        />
      </Card>

      <div className="flex justify-end space-x-4">
        <Button icon={<EyeOutlined />} onClick={handlePreview}>
          预览
        </Button>
        <Button type="primary" icon={<SaveOutlined />} onClick={handleSave}>
          保存
        </Button>
        <Button onClick={onCancel}>取消</Button>
      </div>

      <Modal
        title="模板预览"
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        footer={null}
        width={600}
      >
        <div className="whitespace-pre-wrap">{previewContent}</div>
      </Modal>
    </div>
  );
};

export default TemplateEditor;