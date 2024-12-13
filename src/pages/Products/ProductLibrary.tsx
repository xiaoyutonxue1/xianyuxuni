import React, { useState } from 'react';
import { Card, Table, Button, Input, Space, Modal, Form, Select, message, InputNumber, Switch, Radio, Tag, Tooltip } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, RobotOutlined, LoadingOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import useSettingsStore from '../../store/settingsStore';

const { Search } = Input;

// 模拟数据
const mockProducts = [
  {
    id: '1',
    name: '网易云音乐6个月会员',
    category: '音乐会员',
    price: 128,
    stock: 200,
    createdAt: '2024/3/2 16:30:00',
    status: 'active',
    source: 'manual',
  },
  {
    id: '2',
    name: '腾讯视频会员12个月',
    category: '视频会员',
    price: 258,
    stock: 100,
    createdAt: '2024/3/2 14:00:00',
    status: 'active',
    source: 'manual',
  },
  {
    id: '3',
    name: 'Steam充值卡',
    category: '游戏充值',
    price: 88,
    stock: 50,
    createdAt: '2024/3/2 09:00:00',
    status: 'active',
    source: 'manual',
  },
  {
    id: '4',
    name: 'Bilibili大会员',
    category: '视频会员',
    price: 148,
    stock: 0,
    createdAt: '2024/3/2 08:00:00',
    status: 'crawling',
    source: 'crawler',
    productUrl: 'https://www.bilibili.com/vip/buy',
  },
  {
    id: '5',
    name: '爱奇艺黄金会员',
    category: '视频会员',
    price: 198,
    stock: 500,
    createdAt: '2024/3/1 16:30:00',
    status: 'error',
    source: 'crawler',
    productUrl: 'https://vip.iqiyi.com',
    errorMessage: '商品信息抓取失败',
  }
];

// 商品状态配置
const statusConfig = {
  active: { text: '正常', color: 'success' },
  inactive: { text: '已下架', color: 'default' },
  crawling: { text: '抓取中', color: 'processing' },
  error: { text: '抓取失败', color: 'error' },
};

const ProductLibrary: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState(mockProducts);
  const [total, setTotal] = useState(mockProducts.length);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isMultiSpecs, setIsMultiSpecs] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [addMode, setAddMode] = useState<'manual' | 'crawler'>('manual');
  const [continueModalVisible, setContinueModalVisible] = useState(false);
  const productSettings = useSettingsStore(state => state.productSettings);

  // 重置表单状态
  const resetFormState = () => {
    form.resetFields();
    setIsMultiSpecs(false);
    setEditingProduct(null);
  };

  // 处理新增
  const handleAdd = () => {
    resetFormState();
    setAddMode('manual');
    form.setFieldsValue({
      stock: 999,
      specs: [{ name: '发货网盘', stock: 999 }],
    });
    setIsModalVisible(true);
  };

  // 处理编辑
  const handleEdit = (record: any) => {
    resetFormState();
    setEditingProduct(record);
    setAddMode(record.source);
    
    // 填充表单数据
    const formData = {
      name: record.name,
      category: record.category,
      price: record.price,
      stock: record.stock,
      deliveryMethod: record.deliveryMethod,
      deliveryInfo: record.deliveryInfo,
      useMultiSpecs: record.specs && record.specs.length > 0,
      specs: record.specs || [{ name: '发货网盘', stock: 999 }],
      productUrl: record.productUrl,
    };
    
    form.setFieldsValue(formData);
    setIsMultiSpecs(formData.useMultiSpecs);
    setIsModalVisible(true);
  };

  // 处理保存
  const handleSave = async () => {
    try {
      setSaving(true);
      const values = await form.validateFields();
      
      if (editingProduct) {
        // 编辑模式
        if (editingProduct.source === 'crawler') {
          // 爬虫模式商品
          const urlChanged = editingProduct.productUrl !== values.productUrl;
          const productData = {
            name: values.name,
            productUrl: values.productUrl,
            // 如果链接改变,重置状态和数据
            ...(urlChanged ? {
              status: 'crawling',
              price: 0,
              stock: 999,
              category: '未分类',
            } : {
              status: editingProduct.status,
              price: editingProduct.price,
              stock: editingProduct.stock,
              category: editingProduct.category,
            }),
          };

          const newData = data.map(item => 
            item.id === editingProduct.id 
              ? { 
                  ...item, 
                  ...productData, 
                  updatedAt: new Date().toISOString(),
                }
              : item
          );
          setData(newData);
          message.success(urlChanged ? '商品更新成功,正在重新抓取数据...' : '商品更新成功');
        } else {
          // 手动模式商品
          const productData = {
            name: values.name,
            category: values.category || '未分类',
            price: values.price || 0,
            stock: values.stock || 999,
            deliveryMethod: values.deliveryMethod,
            deliveryInfo: values.deliveryInfo,
            specs: values.useMultiSpecs ? values.specs : [],
            status: 'active',
          };

          const newData = data.map(item => 
            item.id === editingProduct.id 
              ? { ...item, ...productData, updatedAt: new Date().toISOString() }
              : item
          );
          setData(newData);
          message.success('商品编辑成功');
        }
        setIsModalVisible(false);
        resetFormState();
      } else {
        // 新增模式
        const productData = addMode === 'manual' ? {
          name: values.name,
          category: values.category || '未分类',
          price: values.price || 0,
          stock: values.stock || 999,
          deliveryMethod: values.deliveryMethod,
          deliveryInfo: values.deliveryInfo,
          specs: values.useMultiSpecs ? values.specs : [],
          source: 'manual',
          status: 'active',
        } : {
          name: values.name,
          productUrl: values.productUrl,
          category: '未分类',
          price: 0,
          stock: 999,
          source: 'crawler',
          status: 'crawling',
        };

        const newProduct = {
          id: Date.now(),
          ...productData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setData([newProduct, ...data]);
        setTotal(total + 1);
        message.success('商品添加成功');
        setContinueModalVisible(true);
      }
    } catch (error) {
      console.error('表单验证失败:', error);
    } finally {
      setSaving(false);
    }
  };

  // 处理继续添加
  const handleContinue = (shouldContinue: boolean) => {
    setContinueModalVisible(false);
    if (shouldContinue) {
      // 保持当前模式,重置表单
      form.resetFields();
      if (addMode === 'manual') {
        form.setFieldsValue({
          stock: 999,
          specs: [{ name: '发货网盘', stock: 999 }],
        });
      }
    } else {
      // 关闭所有弹窗并重置状态
      setIsModalVisible(false);
      resetFormState();
    }
  };

  // 处理删除
  const handleDelete = (record: any) => {
    setSelectedProduct(record);
    setSelectedRowKeys([]);
    setDeleteModalVisible(true);
  };

  // 处理批量删除
  const handleBatchDelete = () => {
    setSelectedProduct(null);
    setDeleteModalVisible(true);
  };

  // 确认删除
  const confirmDelete = () => {
    if (selectedProduct) {
      // 单个删除
      const newData = data.filter(item => item.id !== selectedProduct.id);
      setData(newData);
      setTotal(newData.length);
      message.success('删除成功');
    } else if (selectedRowKeys.length > 0) {
      // 批量删除
      const newData = data.filter(item => !selectedRowKeys.includes(item.id));
      setData(newData);
      setTotal(newData.length);
      message.success(`成功删除 ${selectedRowKeys.length} 个商品`);
      setSelectedRowKeys([]);
    }
    setDeleteModalVisible(false);
    setSelectedProduct(null);
  };

  // 表格选择配置
  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys: React.Key[]) => {
      setSelectedRowKeys(newSelectedRowKeys);
    },
  };

  // 表格列定义
  const columns = [
    {
      title: '商品名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: any) => (
        <Space>
          {name}
          {record.source === 'crawler' && (
            <RobotOutlined style={{ color: '#1890ff' }} />
          )}
          <Tag color={statusConfig[record.status]?.color}>
            {record.status === 'crawling' && <LoadingOutlined style={{ marginRight: 4 }} />}
            {statusConfig[record.status]?.text}
          </Tag>
          {record.errorMessage && (
            <Tooltip title={record.errorMessage}>
              <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
            </Tooltip>
          )}
        </Space>
      ),
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
    },
    {
      title: '价格',
      dataIndex: 'price',
      key: 'price',
      render: (price: number) => `¥${price.toFixed(2)}`,
    },
    {
      title: '库存',
      dataIndex: 'stock',
      key: 'stock',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space size="middle">
          <Button 
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            disabled={record.status === 'crawling'}
          >
            编辑
          </Button>
          <Button 
            type="text" 
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
            disabled={record.status === 'crawling'}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Card>
      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增商品
        </Button>
        {selectedRowKeys.length > 0 && (
          <Button danger icon={<DeleteOutlined />} onClick={handleBatchDelete}>
            批量删除
          </Button>
        )}
        <Search
          placeholder="搜索商品"
          onSearch={(value) => console.log(value)}
          style={{ width: 200 }}
        />
      </Space>

      <Table
        rowSelection={rowSelection}
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{
          total,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条`,
        }}
      />

      {/* 新增/编辑商品弹窗 */}
      <Modal
        title={editingProduct ? '编辑商品' : '新增商品'}
        open={isModalVisible}
        onOk={handleSave}
        onCancel={() => {
          setIsModalVisible(false);
          resetFormState();
        }}
        width={800}
        centered
        confirmLoading={saving}
      >
        <Form 
          form={form} 
          layout="vertical"
          initialValues={{
            stock: 999,
            useMultiSpecs: false,
            specs: [{ name: '发货网盘', stock: 999 }],
            addMode: 'manual',
          }}
        >
          {!editingProduct && (
            <Form.Item name="addMode" label="添加模式">
              <Radio.Group 
                onChange={e => setAddMode(e.target.value)} 
                value={addMode}
              >
                <Radio.Button value="manual">手动添加</Radio.Button>
                <Radio.Button value="crawler">爬虫抓取</Radio.Button>
              </Radio.Group>
            </Form.Item>
          )}

          <Form.Item
            name="name"
            label={<span className="text-red-500">商品名称 *</span>}
            rules={[{ required: true, message: '请输入商品名称' }]}
          >
            <Input placeholder="请输入商品名称" />
          </Form.Item>

          {(addMode === 'crawler' || editingProduct?.source === 'crawler') ? (
            <Form.Item
              name="productUrl"
              label="商品链接"
              rules={[{ required: true, message: '请输入商品链接' }]}
            >
              <Input placeholder="请输入商品链接" />
            </Form.Item>
          ) : (
            <>
              <Form.Item name="category" label="商品分类">
                <Select
                  placeholder="请选择商品分类"
                  allowClear
                  options={productSettings?.categories?.map(category => ({
                    label: category,
                    value: category,
                  }))}
                />
              </Form.Item>

              <Form.Item name="useMultiSpecs" label="规格设置" valuePropName="checked">
                <Switch
                  checkedChildren="多规格"
                  unCheckedChildren="单规格"
                  checked={isMultiSpecs}
                  onChange={setIsMultiSpecs}
                />
              </Form.Item>

              {isMultiSpecs ? (
                <Form.List name="specs" initialValue={[{ name: '发货网盘', stock: 999 }]}>
                  {(fields, { add, remove }) => (
                    <div className="space-y-4">
                      {fields.map((field, index) => (
                        <div key={field.key} className="border rounded p-4">
                          <div className="flex justify-between items-center mb-4">
                            <div className="text-lg">规格 {index + 1}</div>
                            <Button type="link" danger onClick={() => remove(field.name)}>
                              删除
                            </Button>
                          </div>

                          <Form.Item
                            name={[field.name, 'name']}
                            label="规格名称"
                            initialValue="发货网盘"
                          >
                            <Input placeholder="请输入规格名称" />
                          </Form.Item>

                          <Form.Item
                            name={[field.name, 'price']}
                            label="售价（元）"
                          >
                            <InputNumber
                              min={0}
                              precision={2}
                              style={{ width: '100%' }}
                              placeholder="请输入售价"
                            />
                          </Form.Item>

                          <Form.Item
                            name={[field.name, 'stock']}
                            label="库存（件）"
                            initialValue={999}
                          >
                            <InputNumber
                              min={0}
                              style={{ width: '100%' }}
                              placeholder="请输入库存"
                            />
                          </Form.Item>

                          <Form.Item
                            name={[field.name, 'deliveryMethod']}
                            label="发货方式"
                          >
                            <Select
                              placeholder="请选择发货方式"
                              options={productSettings?.deliveryMethods
                                ?.filter(method => method.isEnabled)
                                ?.map(method => ({
                                  label: method.name,
                                  value: method.value,
                                }))}
                            />
                          </Form.Item>

                          <Form.Item
                            noStyle
                            shouldUpdate={(prevValues: any, currentValues: any) => {
                              const prev = prevValues?.specs?.[field.name]?.deliveryMethod;
                              const curr = currentValues?.specs?.[field.name]?.deliveryMethod;
                              return prev !== curr;
                            }}
                          >
                            {({ getFieldValue }) => {
                              const methodValue = getFieldValue(['specs', field.name, 'deliveryMethod']);
                              const method = productSettings?.deliveryMethods?.find(m => m.value === methodValue);
                              
                              if (!method?.fields) return null;
                              
                              return (
                                <div className="pl-4 border-l-2 border-gray-200">
                                  {method.fields.map(fieldConfig => (
                                    <Form.Item
                                      key={fieldConfig.id}
                                      name={[field.name, 'deliveryInfo', fieldConfig.key]}
                                      label={fieldConfig.name}
                                    >
                                      <Input placeholder={fieldConfig.placeholder} />
                                    </Form.Item>
                                  ))}
                                </div>
                              );
                            }}
                          </Form.Item>
                        </div>
                      ))}

                      <Button
                        type="dashed"
                        onClick={() => add({ name: '发货网盘', stock: 999 })}
                        style={{ width: '100%' }}
                        icon={<PlusOutlined />}
                      >
                        添加规格
                      </Button>
                    </div>
                  )}
                </Form.List>
              ) : (
                <>
                  <Form.Item name="price" label="售价（元）">
                    <InputNumber
                      min={0}
                      precision={2}
                      style={{ width: '100%' }}
                      placeholder="请输入售价"
                    />
                  </Form.Item>

                  <Form.Item name="stock" label="库存（件）" initialValue={999}>
                    <InputNumber
                      min={0}
                      style={{ width: '100%' }}
                      placeholder="请输入库存"
                    />
                  </Form.Item>

                  <Form.Item name="deliveryMethod" label="发货方式">
                    <Select
                      placeholder="请选择发货方式"
                      options={productSettings?.deliveryMethods
                        ?.filter(method => method.isEnabled)
                        ?.map(method => ({
                          label: method.name,
                          value: method.value,
                        }))}
                    />
                  </Form.Item>

                  <Form.Item
                    noStyle
                    shouldUpdate={(prevValues: any, currentValues: any) => {
                      return prevValues?.deliveryMethod !== currentValues?.deliveryMethod;
                    }}
                  >
                    {({ getFieldValue }) => {
                      const methodValue = getFieldValue('deliveryMethod');
                      const method = productSettings?.deliveryMethods?.find(m => m.value === methodValue);
                      
                      if (!method?.fields) return null;
                      
                      return (
                        <div className="pl-4 border-l-2 border-gray-200">
                          {method.fields.map(field => (
                            <Form.Item
                              key={field.id}
                              name={['deliveryInfo', field.key]}
                              label={field.name}
                            >
                              <Input placeholder={field.placeholder} />
                            </Form.Item>
                          ))}
                        </div>
                      );
                    }}
                  </Form.Item>
                </>
              )}
            </>
          )}
        </Form>
      </Modal>

      {/* 继续添加确认框 */}
      <Modal
        title="添加成功"
        open={continueModalVisible}
        onCancel={() => handleContinue(false)}
        footer={[
          <Button key="back" onClick={() => handleContinue(false)}>
            关闭
          </Button>,
          <Button key="continue" type="primary" onClick={() => handleContinue(true)}>
            继续添加
          </Button>,
        ]}
        centered
      >
        <p>商品添加成功,是否继续添加?</p>
      </Modal>

      {/* 删除确认弹窗 */}
      <Modal
        title="确认删除"
        open={deleteModalVisible}
        onOk={confirmDelete}
        onCancel={() => {
          setDeleteModalVisible(false);
          setSelectedProduct(null);
        }}
        centered
      >
        {selectedProduct ? (
          <p>确定要删除商品 "{selectedProduct.name}" 吗？此操作不可恢复。</p>
        ) : (
          <p>确定要删除选中的 {selectedRowKeys.length} 个商品吗？此操作不可恢复。</p>
        )}
      </Modal>
    </Card>
  );
};

export default ProductLibrary; 