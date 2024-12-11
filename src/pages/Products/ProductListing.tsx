import React, { useState } from 'react';
import { Card, Table, Button, Input, Space, Tag, Select, Modal, Form, Upload, message, Tooltip } from 'antd';
import { UploadOutlined, DownloadOutlined, PlusOutlined, InfoCircleOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import type { ColumnsType } from 'antd/es/table';

const { Search } = Input;
const { TextArea } = Input;

interface ProductListingItem {
  id: number;
  name: string;
  store: string;
  category: string;
  status: 'draft' | 'selling' | 'offline';
  price: string;
  originalPrice: string;
  stock: number;
  sales: number;
  updatedAt: string;
  lastUpdateBy: string;
}

interface ProductFormValues {
  id?: number;
  name: string;
  store: string;
  category: string;
  price: string;
  originalPrice: string;
  description: string;
  headImage: UploadFile[];
  publicImages: UploadFile[];
}

// 添加示例数据
const mockData: ProductListingItem[] = [
  {
    id: 1,
    name: '王者荣耀点券充值',
    store: '游戏商城1号店',
    category: '游戏充值',
    status: 'selling',
    price: '98.00',
    originalPrice: '100.00',
    stock: 999,
    sales: 152,
    updatedAt: '2024-03-01 10:00:00',
    lastUpdateBy: '系统管理员',
  },
  {
    id: 2,
    name: '和平精英UC充值卡',
    store: '游戏商城1号店',
    category: '游戏充值',
    status: 'selling',
    price: '198.00',
    originalPrice: '200.00',
    stock: 888,
    sales: 89,
    updatedAt: '2024-03-01 11:30:00',
    lastUpdateBy: '系统管理员',
  },
  {
    id: 3,
    name: 'Steam充值卡',
    store: '游戏商城2号店',
    category: '游戏充值',
    status: 'draft',
    price: '500.00',
    originalPrice: '520.00',
    stock: 200,
    sales: 0,
    updatedAt: '2024-03-02 09:15:00',
    lastUpdateBy: '运营专员',
  },
  {
    id: 4,
    name: '腾讯视频会员12个月',
    store: '视频会员专营店',
    category: '视频会员',
    status: 'selling',
    price: '253.00',
    originalPrice: '288.00',
    stock: 500,
    sales: 234,
    updatedAt: '2024-03-02 14:20:00',
    lastUpdateBy: '运营专员',
  },
  {
    id: 5,
    name: '网易云音乐年卡',
    store: '音乐会员专营店',
    category: '音乐会员',
    status: 'offline',
    price: '128.00',
    originalPrice: '168.00',
    stock: 0,
    sales: 456,
    updatedAt: '2024-03-02 16:45:00',
    lastUpdateBy: '系统管理员',
  },
];

const ProductListing: React.FC = () => {
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isBatchUploadVisible, setIsBatchUploadVisible] = useState(false);
  const [form] = Form.useForm();

  const columns: ColumnsType<ProductListingItem> = [
    {
      title: '商品名称',
      dataIndex: 'name',
      key: 'name',
      width: 180,
    },
    {
      title: '发布店铺',
      dataIndex: 'store',
      key: 'store',
      width: 150,
      filters: [
        { text: '游戏商城1号店', value: '游戏商城1号店' },
        { text: '游戏商城2号店', value: '游戏商城2号店' },
        { text: '视频会员专营店', value: '视频会员专营店' },
        { text: '音乐会员专营店', value: '音乐会员专营店' },
      ],
      onFilter: (value: string | number | boolean, record: ProductListingItem) => 
        record.store === value,
    },
    {
      title: '商品分类',
      dataIndex: 'category',
      key: 'category',
      width: 120,
      filters: [
        { text: '游戏充值', value: '游戏充值' },
        { text: '视频会员', value: '视频会员' },
        { text: '音乐会员', value: '音乐会员' },
      ],
      onFilter: (value: string | number | boolean, record: ProductListingItem) => 
        record.category === value,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: 'draft' | 'selling' | 'offline') => {
        const statusMap = {
          draft: { color: 'default', text: '草稿' },
          selling: { color: 'green', text: '在售' },
          offline: { color: 'red', text: '下架' },
        };
        const { color, text } = statusMap[status];
        return <Tag color={color}>{text}</Tag>;
      },
      filters: [
        { text: '草稿', value: 'draft' },
        { text: '在售', value: 'selling' },
        { text: '下架', value: 'offline' },
      ],
      onFilter: (value: string | number | boolean, record: ProductListingItem) => 
        record.status === value,
    },
    {
      title: '价格',
      dataIndex: 'price',
      key: 'price',
      width: 100,
      render: (price: string, record: ProductListingItem) => (
        <Tooltip title={`原价：￥${record.originalPrice}`}>
          <span>￥{price}</span>
        </Tooltip>
      ),
      sorter: (a: ProductListingItem, b: ProductListingItem) => 
        parseFloat(a.price) - parseFloat(b.price),
    },
    {
      title: '库存',
      dataIndex: 'stock',
      key: 'stock',
      width: 100,
      sorter: (a: ProductListingItem, b: ProductListingItem) => a.stock - b.stock,
    },
    {
      title: '销量',
      dataIndex: 'sales',
      key: 'sales',
      width: 100,
      sorter: (a: ProductListingItem, b: ProductListingItem) => a.sales - b.sales,
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 180,
      render: (updatedAt: string, record: ProductListingItem) => (
        <Tooltip title={`最后更新：${record.lastUpdateBy}`}>
          <span>{updatedAt}</span>
        </Tooltip>
      ),
      sorter: (a: ProductListingItem, b: ProductListingItem) => 
        new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(),
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_: unknown, record: ProductListingItem) => (
        <Space size="middle">
          <a onClick={() => handleEdit(record)}>编辑</a>
          <a onClick={() => handleStatusChange(record)}>
            {record.status === 'selling' ? '下架' : '上架'}
          </a>
          <a onClick={() => handleDelete(record)}>删除</a>
        </Space>
      ),
    },
  ];

  const handleEdit = (record: ProductListingItem) => {
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  const handleStatusChange = (record: ProductListingItem) => {
    const newStatus = record.status === 'selling' ? 'offline' : 'selling';
    Modal.confirm({
      title: '确认操作',
      content: `确定要${newStatus === 'selling' ? '上架' : '下架'}商品"${record.name}"吗？`,
      onOk() {
        message.success(`${newStatus === 'selling' ? '上架' : '下架'}成功`);
      },
    });
  };

  const handleDelete = (record: ProductListingItem) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除商品"${record.name}"吗？`,
      onOk() {
        message.success('删除成功');
      },
    });
  };

  const handleBatchUpload = () => {
    setIsBatchUploadVisible(true);
  };

  const onModalOk = () => {
    form.validateFields().then((values: ProductFormValues) => {
      console.log('Form values:', values);
      message.success('保存成功');
      setIsModalVisible(false);
      form.resetFields();
    });
  };

  const onBatchUploadOk = () => {
    message.success('批量上传成功');
    setIsBatchUploadVisible(false);
  };

  const uploadProps = {
    action: 'https://www.mocky.io/v2/5cc8019d300000980a055e76',
    listType: 'picture-card' as const,
    maxCount: 1,
  };

  const multipleUploadProps = {
    action: 'https://www.mocky.io/v2/5cc8019d300000980a055e76',
    listType: 'picture-card' as const,
    multiple: true,
  };

  return (
    <div className="space-y-4">
      <Card>
        <div className="space-y-4">
          <div className="flex justify-between">
            <Space>
              <Button type="primary" icon={<UploadOutlined />} onClick={handleBatchUpload}>
                批量上架
              </Button>
              <Button icon={<DownloadOutlined />}>
                导出数据
              </Button>
              <Select
                placeholder="选择店铺"
                style={{ width: 200 }}
                options={[
                  { label: '全部店铺', value: 'all' },
                  { label: '游戏商城1号店', value: 'store1' },
                  { label: '游戏商城2号店', value: 'store2' },
                  { label: '视频会员专营店', value: 'store3' },
                  { label: '音乐会员专营店', value: 'store4' },
                ]}
              />
              <Select
                placeholder="商品状态"
                style={{ width: 200 }}
                options={[
                  { label: '全部状态', value: 'all' },
                  { label: '草稿', value: 'draft' },
                  { label: '在售', value: 'selling' },
                  { label: '下架', value: 'offline' },
                ]}
              />
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

      {/* 编辑商品弹窗 */}
      <Modal
        title="编辑商品"
        open={isModalVisible}
        onOk={onModalOk}
        onCancel={() => setIsModalVisible(false)}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item name="id" hidden>
            <Input />
          </Form.Item>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="name"
              label="商品名称"
              rules={[{ required: true, message: '请输入商品名称' }]}
            >
              <Input placeholder="请输入商品名称" />
            </Form.Item>
            <Form.Item
              name="store"
              label="发布店铺"
              rules={[{ required: true, message: '请选择发布店铺' }]}
            >
              <Select
                options={[
                  { label: '游戏商城1号店', value: '游戏商城1号店' },
                  { label: '游戏商城2号店', value: '游戏商城2号店' },
                  { label: '视频会员专营店', value: '视频会员专营店' },
                  { label: '音乐会员专营店', value: '音乐会员专营店' },
                ]}
              />
            </Form.Item>
            <Form.Item
              name="category"
              label="商品分类"
              rules={[{ required: true, message: '请选择商品分类' }]}
            >
              <Select
                options={[
                  { label: '游戏充值', value: '游戏充值' },
                  { label: '视频会员', value: '视频会员' },
                  { label: '音乐会员', value: '音乐会员' },
                ]}
              />
            </Form.Item>
            <Form.Item
              name="price"
              label="售价"
              rules={[{ required: true, message: '请输入售价' }]}
            >
              <Input prefix="￥" type="number" />
            </Form.Item>
            <Form.Item
              name="originalPrice"
              label="原价"
              rules={[{ required: true, message: '请输入原价' }]}
            >
              <Input prefix="￥" type="number" />
            </Form.Item>
            <Form.Item
              name="stock"
              label="库存"
              rules={[{ required: true, message: '请输入库存' }]}
            >
              <Input type="number" />
            </Form.Item>
          </div>
          <Form.Item
            name="description"
            label="商品描述"
            rules={[{ required: true, message: '请输入商品描述' }]}
          >
            <TextArea rows={4} />
          </Form.Item>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="headImage"
              label={
                <Space>
                  <span>头图</span>
                  <Tooltip title="每个店铺独立的商品主图">
                    <InfoCircleOutlined />
                  </Tooltip>
                </Space>
              }
              rules={[{ required: true, message: '请上传头图' }]}
            >
              <Upload {...uploadProps}>
                <div>
                  <PlusOutlined />
                  <div style={{ marginTop: 8 }}>上传</div>
                </div>
              </Upload>
            </Form.Item>
            <Form.Item
              name="publicImages"
              label={
                <Space>
                  <span>公共图片</span>
                  <Tooltip title="所有店铺共用的商品图片">
                    <InfoCircleOutlined />
                  </Tooltip>
                </Space>
              }
            >
              <Upload {...multipleUploadProps}>
                <div>
                  <PlusOutlined />
                  <div style={{ marginTop: 8 }}>上传</div>
                </div>
              </Upload>
            </Form.Item>
          </div>
        </Form>
      </Modal>

      {/* 批量上传弹窗 */}
      <Modal
        title="批量上架"
        open={isBatchUploadVisible}
        onOk={onBatchUploadOk}
        onCancel={() => setIsBatchUploadVisible(false)}
        width={600}
      >
        <div className="space-y-4">
          <div>
            <h4 className="mb-2">选择店铺</h4>
            <Select
              mode="multiple"
              style={{ width: '100%' }}
              placeholder="请选择要上架的店铺"
              options={[
                { label: '游戏商城1号店', value: 'store1' },
                { label: '游戏商城2号店', value: 'store2' },
                { label: '视频会员专营店', value: 'store3' },
                { label: '音乐会员专营店', value: 'store4' },
              ]}
            />
          </div>
          <div>
            <h4 className="mb-2">上传商品图片</h4>
            <Upload.Dragger multiple>
              <p className="ant-upload-drag-icon">
                <UploadOutlined />
              </p>
              <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
              <p className="ant-upload-hint">支持单个或批量上传图片</p>
            </Upload.Dragger>
          </div>
          <div>
            <h4 className="mb-2">导出路径设置</h4>
            <Input placeholder="请选择导出路径" />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ProductListing; 