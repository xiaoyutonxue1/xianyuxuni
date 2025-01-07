import React from 'react';
import { Card, Form, Input, Button, Select, Space, Tag, message, Modal, Table, Dropdown, Switch } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, DownOutlined } from '@ant-design/icons';
import { v4 as uuidv4 } from 'uuid';
import styles from './TemplateSettings.module.css';

interface Template {
  id: string;
  name: string;
  title: string;
  description: string;
  isDefault: boolean;
}

// 定义可用的占位符
const placeholders = {
  title: '标题',
  description: '描述',
  category: '分类',
  price: '价格',
  stock: '库存',
  deliveryMethod: '发货方式',
  deliveryInfo: '发货信息',
  sourceUrl: '来源链接',
  sourceStatus: '来源状态',
  sourceType: '来源类型',
  remark: '备注',
};

const TemplateSettings: React.FC = () => {
  const [templates, setTemplates] = React.useState<Template[]>([]);
  const [isModalVisible, setIsModalVisible] = React.useState(false);
  const [currentTemplate, setCurrentTemplate] = React.useState<Template | undefined>();
  const [form] = Form.useForm();

  const handleAddTemplate = () => {
    setCurrentTemplate(undefined);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEditTemplate = (template: Template) => {
    setCurrentTemplate(template);
    form.setFieldsValue(template);
    setIsModalVisible(true);
  };

  const handleDeleteTemplate = (templateId: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个模板吗？删除后无法恢复。',
      onOk: () => {
        setTemplates(templates.filter(t => t.id !== templateId));
        message.success('删除成功');
      }
    });
  };

  const handleSetDefaultTemplate = (templateId: string) => {
    setTemplates(templates.map(t => ({
      ...t,
      isDefault: t.id === templateId
    })));
    message.success('设置成功');
  };

  const handleSubmit = (values: any) => {
    const newTemplate = {
      ...values,
      id: currentTemplate?.id || uuidv4()
    };

    let newTemplates: Template[];
    if (currentTemplate) {
      newTemplates = templates.map(t => 
        t.id === currentTemplate.id ? newTemplate : t
      );
    } else {
      newTemplates = [...templates, newTemplate];
    }

    if (values.isDefault) {
      newTemplates = newTemplates.map(t => ({
        ...t,
        isDefault: t.id === newTemplate.id
      }));
    }

    setTemplates(newTemplates);
    setIsModalVisible(false);
    setCurrentTemplate(undefined);
    form.resetFields();
    message.success(currentTemplate ? '编辑成功' : '添加成功');
  };

  // 处理插入占位符
  const handleInsertPlaceholder = (field: string, placeholder: string) => {
    const fieldValue = form.getFieldValue(field) || '';
    const cursorPosition = (document.activeElement as HTMLTextAreaElement)?.selectionStart || fieldValue.length;
    const newValue = fieldValue.slice(0, cursorPosition) + `{${placeholder}}` + fieldValue.slice(cursorPosition);
    form.setFieldValue(field, newValue);
  };

  // 生成占位符菜单项
  const placeholderMenuItems = Object.entries(placeholders).map(([key, label]) => ({
    key,
    label: `插入${label}`,
    onClick: () => {
      const activeElement = document.activeElement;
      if (activeElement) {
        const fieldName = activeElement.id.split('_').pop();
        if (fieldName) {
          handleInsertPlaceholder(fieldName, key);
        }
      }
    }
  }));

  const columns = [
    {
      title: '模板名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Template) => (
        <Space>
          {text}
          {record.isDefault && <Tag color="blue">默认</Tag>}
        </Space>
      )
    },
    {
      title: '标题模板',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true
    },
    {
      title: '文案模板',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Template) => (
        <Space>
          {!record.isDefault && (
            <Button
              type="link"
              size="small"
              onClick={() => handleSetDefaultTemplate(record.id)}
            >
              设为默认
            </Button>
          )}
          <Button
            type="link"
            size="small"
            onClick={() => handleEditTemplate(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            danger
            size="small"
            onClick={() => handleDeleteTemplate(record.id)}
          >
            删除
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div className="p-6">
      <Card
        title="模板管理"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddTemplate}
          >
            新增模板
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={templates}
          rowKey="id"
          pagination={false}
        />
      </Card>

      <Modal
        title={currentTemplate ? '编辑模板' : '新增模板'}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          setCurrentTemplate(undefined);
          form.resetFields();
        }}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="name"
            label="模板名称"
            rules={[{ required: true, message: '请输入模板名称' }]}
          >
            <Input placeholder="请输入模板名称" />
          </Form.Item>

          <Form.Item
            name="title"
            label={
              <Space>
                标题模板
                <Dropdown menu={{ items: placeholderMenuItems }}>
                  <Button size="small">
                    插入占位符 <DownOutlined />
                  </Button>
                </Dropdown>
              </Space>
            }
            tooltip="使用 {title} 等占位符表示对应的字段"
            rules={[{ required: true, message: '请输入标题模板' }]}
          >
            <Input.TextArea
              placeholder="例如：【正版资源】{title}"
              rows={2}
            />
          </Form.Item>

          <Form.Item
            name="description"
            label={
              <Space>
                文案模板
                <Dropdown menu={{ items: placeholderMenuItems }}>
                  <Button size="small">
                    插入占位符 <DownOutlined />
                  </Button>
                </Dropdown>
              </Space>
            }
            tooltip="使用 {description} 等占位符表示对应的字段"
            rules={[{ required: true, message: '请输入文案模板' }]}
          >
            <Input.TextArea
              placeholder="例如：✨ {description}&#10;&#10;💫 发货方式：{deliveryMethod}&#10;🌟 售后服务：终身有效"
              rows={6}
            />
          </Form.Item>

          <Form.Item name="isDefault" valuePropName="checked">
            <Switch checkedChildren="默认模板" unCheckedChildren="普通模板" />
          </Form.Item>

          <Form.Item className="mb-0 text-right">
            <Space>
              <Button onClick={() => {
                setIsModalVisible(false);
                setCurrentTemplate(undefined);
                form.resetFields();
              }}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                确定
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TemplateSettings; 