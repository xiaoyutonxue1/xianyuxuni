import React, { useState } from 'react';
import { Card, Table, Button, Radio, Input, Space, Tag, Modal, Form, Select, Upload, message } from 'antd';
import { PlusOutlined, UploadOutlined, LinkOutlined } from '@ant-design/icons';
import type { RadioChangeEvent } from 'antd';
import type { ColumnsType } from 'antd/es/table';

const { Search } = Input;
const { TextArea } = Input;

interface ProductSelectionItem {
  id: number;
  name: string;
  method: 'crawler' | 'manual';
  status: 'pending' | 'processed';
  createdAt: string;
  price: string;
  source: string;
  link?: string;
}

interface ExportSettingsFormValues {
  path: string;
  nameRule: string;
  format: 'excel' | 'csv';
}

// 添加示例数据
const mockData: ProductSelectionItem[] = [
  {
    id: 1,
    name: '王者荣耀点券充值',
    method: 'crawler',
    status: 'pending',
    createdAt: '2024-03-01 10:00:00',
    price: '98.00',
    source: '闲鱼',
    link: 'https://2.taobao.com/item1',
  },
  {
    id: 2,
    name: '和平精英UC充值卡',
    method: 'crawler',
    status: 'processed',
    createdAt: '2024-03-01 11:30:00',
    price: '198.00',
    source: '闲鱼',
    link: 'https://2.taobao.com/item2',
  },
  {
    id: 3,
    name: 'Steam充值卡',
    method: 'manual',
    status: 'pending',
    createdAt: '2024-03-02 09:15:00',
    price: '500.00',
    source: '手动添加',
  },
  {
    id: 4,
    name: '腾讯视频会员12个月',
    method: 'manual',
    status: 'processed',
    createdAt: '2024-03-02 14:20:00',
    price: '253.00',
    source: '手动添加',
  },
  {
    id: 5,
    name: '网易云音乐年卡',
    method: 'crawler',
    status: 'pending',
    createdAt: '2024-03-02 16:45:00',
    price: '128.00',
    source: '闲鱼',
    link: 'https://2.taobao.com/item5',
  },
];

const ProductSelection: React.FC = () => {
  const [selectionMethod, setSelectionMethod] = useState<'crawler' | 'manual'>('crawler');
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isExportModalVisible, setIsExportModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [exportForm] = Form.useForm();

  const columns: ColumnsType<ProductSelectionItem> = [
    {
      title: '商品名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
    },
    {
      title: '选品方式',
      dataIndex: 'method',
      key: 'method',
      width: 120,
      render: (method: 'crawler' | 'manual') => (
        <Tag color={method === 'crawler' ? 'blue' : 'green'}>
          {method === 'crawler' ? '爬虫选品' : '手动选品'}
        </Tag>
      ),
      filters: [
        { text: '爬虫选品', value: 'crawler' },
        { text: '手动选品', value: 'manual' },
      ],
      onFilter: (value: string | number | boolean, record: ProductSelectionItem) => 
        record.method === value,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: 'pending' | 'processed') => (
        <Tag color={status === 'pending' ? 'orange' : 'green'}>
          {status === 'pending' ? '待处理' : '已处理'}
        </Tag>
      ),
      filters: [
        { text: '待处理', value: 'pending' },
        { text: '已处理', value: 'processed' },
      ],
      onFilter: (value: string | number | boolean, record: ProductSelectionItem) => 
        record.status === value,
    },
    {
      title: '价格',
      dataIndex: 'price',
      key: 'price',
      width: 120,
      render: (price: string) => `￥${price}`,
      sorter: (a: ProductSelectionItem, b: ProductSelectionItem) => 
        parseFloat(a.price) - parseFloat(b.price),
    },
    {
      title: '来源',
      dataIndex: 'source',
      key: 'source',
      width: 120,
    },
    {
      title: '商品链接',
      dataIndex: 'link',
      key: 'link',
      width: 150,
      render: (link: string | undefined) => link ? (
        <a href={link} target="_blank" rel="noopener noreferrer">
          <LinkOutlined /> 查看链接
        </a>
      ) : '-',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      sorter: (a: ProductSelectionItem, b: ProductSelectionItem) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: unknown, record: ProductSelectionItem) => (
        <Space size="middle">
          <a onClick={() => handleEdit(record)}>编辑</a>
          <a onClick={() => handleDelete(record)}>删除</a>
        </Space>
      ),
    },
  ];

  const handleMethodChange = (e: RadioChangeEvent) => {
    setSelectionMethod(e.target.value);
    form.resetFields();
  };

  const handleAddProduct = () => {
    setIsAddModalVisible(true);
  };

  const handleExportProducts = () => {
    setIsExportModalVisible(true);
  };

  const handleEdit = (record: ProductSelectionItem) => {
    form.setFieldsValue(record);
    setIsAddModalVisible(true);
  };

  const handleDelete = (record: ProductSelectionItem) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除商品"${record.name}"吗？`,
      onOk() {
        message.success('删除成功');
      },
    });
  };

  const onAddModalOk = () => {
    form.validateFields().then((values) => {
      console.log('Form values:', values);
      message.success('保存成功');
      setIsAddModalVisible(false);
      form.resetFields();
    });
  };

  const onExportModalOk = () => {
    exportForm.validateFields().then((values: ExportSettingsFormValues) => {
      console.log('Export settings:', values);
      message.success('导出成功');
      setIsExportModalVisible(false);
      exportForm.resetFields();
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <div className="space-y-4">
          <div>
            <Radio.Group value={selectionMethod} onChange={handleMethodChange}>
              <Radio.Button value="crawler">爬虫选品</Radio.Button>
              <Radio.Button value="manual">手动选品</Radio.Button>
            </Radio.Group>
          </div>
          
          <div className="flex justify-between">
            <Space>
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAddProduct}>
                新增选品
              </Button>
              <Button icon={<UploadOutlined />} onClick={handleExportProducts}>
                导出选品
              </Button>
            </Space>
            <Search placeholder="搜索商品" style={{ width: 300 }} />
          </div>
        </div>
      </Card>

      <Table
        columns={columns}
        dataSource={mockData}
        rowKey="id"
        rowSelection={{
          type: 'checkbox',
        }}
        pagination={{
          total: mockData.length,
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
        }}
      />

      {/* 新增/编辑选品弹窗 */}
      <Modal
        title={form.getFieldValue('id') ? '编辑选品' : '新增选品'}
        open={isAddModalVisible}
        onOk={onAddModalOk}
        onCancel={() => setIsAddModalVisible(false)}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ method: selectionMethod }}
        >
          <Form.Item name="id" hidden>
            <Input />
          </Form.Item>
          <Form.Item
            name="name"
            label="商品名称"
            rules={[{ required: true, message: '请输入商品名称' }]}
          >
            <Input placeholder="请��入商品名称" />
          </Form.Item>
          {selectionMethod === 'crawler' ? (
            <Form.Item
              name="link"
              label="商品链接"
              rules={[
                { required: true, message: '请输入商品链接' },
                { type: 'url', message: '请输入有效的URL' }
              ]}
            >
              <Input placeholder="请输入闲鱼商品链接" />
            </Form.Item>
          ) : (
            <>
              <Form.Item
                name="price"
                label="商品价格"
                rules={[{ required: true, message: '请输入商品价格' }]}
              >
                <Input prefix="￥" type="number" placeholder="请输入商品价格" />
              </Form.Item>
              <Form.Item
                name="description"
                label="商品描述"
              >
                <TextArea rows={4} placeholder="请输入商品描述" />
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>

      {/* 导出设置弹窗 */}
      <Modal
        title="导出设置"
        open={isExportModalVisible}
        onOk={onExportModalOk}
        onCancel={() => setIsExportModalVisible(false)}
      >
        <Form
          form={exportForm}
          layout="vertical"
          initialValues={{ format: 'excel' }}
        >
          <Form.Item
            name="path"
            label="导出路径"
            rules={[{ required: true, message: '请选择导出路径' }]}
          >
            <Input placeholder="请选择导出路径" />
          </Form.Item>
          <Form.Item
            name="nameRule"
            label="文件命名规则"
            rules={[{ required: true, message: '请输入文件命名规则' }]}
          >
            <Input placeholder="例如：选品数据_{date}" />
          </Form.Item>
          <Form.Item
            name="format"
            label="导出格式"
            rules={[{ required: true, message: '请选择导出格式' }]}
          >
            <Select>
              <Select.Option value="excel">Excel</Select.Option>
              <Select.Option value="csv">CSV</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ProductSelection; 