import React, { useState, useEffect } from 'react';
import { Card, Tabs, Form, Input, Button, Select, InputNumber, Switch, Space, Tag, message, Modal, Table, Divider } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import useSettingsStore from '../../store/settingsStore';
import type { StoreGroup, StoreAccount, DeliveryMethodSetting, ProductTemplate } from '../../store/settingsStore';
import { v4 as uuidv4 } from 'uuid';
import type { FormInstance } from 'antd';

const { TabPane } = Tabs;

// 模拟数据
const mockStores: StoreAccount[] = [
  {
    id: '1',
    name: '水城有趣的海鲜',
    platform: '闲鱼',
    features: {
      priceAdjustment: 0.1,
      customFields: {
        slogan: '新鲜美味，品质保证',
        servicePromise: '24小时发货，售后无忧',
      },
    },
  },
  {
    id: '2',
    name: '巨全资料库',
    platform: '闲鱼',
    features: {
      priceAdjustment: 0,
      customFields: {
        slogan: '资料齐全，价格实惠',
        servicePromise: '资料保真，售后保障',
      },
    },
  },
];

const mockGroups: StoreGroup[] = [
  {
    id: '1',
    name: '主力店铺',
    storeIds: ['1'],
  },
  {
    id: '2',
    name: '测试店铺',
    storeIds: ['2'],
  },
];

const defaultDeliveryMethods: DeliveryMethodSetting[] = [
  { id: 'baiduDisk', name: '百度网盘链接', value: 'baiduDisk', isEnabled: true },
  { id: 'baiduDiskGroup', name: '百度网盘群链接', value: 'baiduDiskGroup', isEnabled: true },
  { id: 'baiduDiskGroupCode', name: '百度网盘群口令', value: 'baiduDiskGroupCode', isEnabled: true },
  { id: 'quarkDisk', name: '夸克网盘链接', value: 'quarkDisk', isEnabled: true },
  { id: 'quarkDiskGroup', name: '夸克网盘群链接', value: 'quarkDiskGroup', isEnabled: true }
];

// 商品模板表单
const TemplateForm: React.FC<{
  initialValues?: ProductTemplate;
  onSubmit: (values: ProductTemplate) => void;
  onCancel: () => void;
}> = ({ initialValues, onSubmit, onCancel }) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue(initialValues);
    }
  }, [initialValues, form]);

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onSubmit}
      initialValues={initialValues}
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
        label="标题模板"
        tooltip="使用 {title} 表示原始标题"
        rules={[{ required: true, message: '请输入标题模板' }]}
      >
        <Input.TextArea
          placeholder="例如：【正版资源】{title}"
          rows={2}
        />
      </Form.Item>

      <Form.Item
        name="description"
        label="文案模板"
        tooltip="使用 {description} 表示原始描述"
        rules={[{ required: true, message: '请输入文案模板' }]}
      >
        <Input.TextArea
          placeholder="例如：✨ {description}&#10;&#10;💫 发货方式：网盘自动发货&#10;🌟 售后服务：终身有效"
          rows={4}
        />
      </Form.Item>

      <Form.Item name="isDefault" valuePropName="checked">
        <Switch checkedChildren="默认模板" unCheckedChildren="普通模板" />
      </Form.Item>

      <Form.Item className="mb-0 text-right">
        <Space>
          <Button onClick={onCancel}>取消</Button>
          <Button type="primary" htmlType="submit">
            确定
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
};

// 商品模板列表
const TemplateList: React.FC<{
  templates: ProductTemplate[];
  onEdit: (template: ProductTemplate) => void;
  onDelete: (templateId: string) => void;
  onSetDefault: (templateId: string) => void;
}> = ({ templates, onEdit, onDelete, onSetDefault }) => {
  return (
    <div className="space-y-4">
      {templates.map(template => (
        <Card
          key={template.id}
          size="small"
          title={
            <Space>
              {template.name}
              {template.isDefault && <Tag color="blue">默认</Tag>}
            </Space>
          }
          extra={
            <Space>
              {!template.isDefault && (
                <Button
                  type="link"
                  size="small"
                  onClick={() => onSetDefault(template.id)}
                >
                  设为默认
                </Button>
              )}
              <Button
                type="link"
                size="small"
                onClick={() => onEdit(template)}
              >
                编辑
              </Button>
              <Button
                type="link"
                danger
                size="small"
                onClick={() => onDelete(template.id)}
              >
                删除
              </Button>
            </Space>
          }
        >
          <div className="space-y-2">
            <div>
              <div className="text-gray-500 mb-1">标题模板：</div>
              <div className="bg-gray-50 p-2 rounded">{template.title}</div>
            </div>
            <div>
              <div className="text-gray-500 mb-1">文案模板：</div>
              <div className="bg-gray-50 p-2 rounded whitespace-pre-wrap">{template.description}</div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

// 店铺表单
const StoreForm: React.FC<{
  form: FormInstance;
  initialValues?: StoreAccount;
  onSubmit: (values: StoreAccount) => void;
  onCancel: () => void;
}> = ({ form, initialValues, onSubmit, onCancel }) => {
  const [isTemplateModalVisible, setIsTemplateModalVisible] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<ProductTemplate | undefined>();
  const [templates, setTemplates] = useState<ProductTemplate[]>(
    initialValues?.features?.templates || []
  );

  useEffect(() => {
    if (form && initialValues) {
      form.setFieldsValue(initialValues);
      setTemplates(initialValues.features?.templates || []);
    }
  }, [form, initialValues]);

  const handleSubmit = (values: any) => {
    onSubmit({
      ...values,
      features: {
        ...values.features,
        templates,
        priceAdjustment: values.features?.priceAdjustment || 0
      }
    });
  };

  const handleTemplateSubmit = (values: ProductTemplate) => {
    let newTemplates: ProductTemplate[];
    const newTemplate = {
      ...values,
      id: currentTemplate?.id || uuidv4()
    };
    
    if (currentTemplate) {
      // 编辑现有模板
      newTemplates = templates.map(t => 
        t.id === currentTemplate.id ? newTemplate : t
      );
    } else {
      // 添加新模板
      newTemplates = [...templates, newTemplate];
    }

    // 如果设置了新的默认模板，需要取消其他模板的默认状态
    if (values.isDefault) {
      newTemplates = newTemplates.map(t => ({
        ...t,
        isDefault: t.id === newTemplate.id
      }));
    }

    setTemplates(newTemplates);
    setIsTemplateModalVisible(false);
    setCurrentTemplate(undefined);
  };

  const handleDeleteTemplate = (templateId: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个模板吗？删除后无法恢复。',
      onOk: () => {
        setTemplates(templates.filter(t => t.id !== templateId));
      }
    });
  };

  const handleSetDefaultTemplate = (templateId: string) => {
    setTemplates(templates.map(t => ({
      ...t,
      isDefault: t.id === templateId
    })));
  };

  return (
    <div className="space-y-4">
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={initialValues}
      >
        {/* 基础信息 */}
        <Card title="基础信息" className="shadow-sm">
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="name"
              label="店铺名称"
              rules={[{ required: true, message: '请输入店铺名称' }]}
            >
              <Input placeholder="请输入店铺名称" />
            </Form.Item>

            <Form.Item
              name="platform"
              label="所属平台"
              rules={[{ required: true, message: '请选择所属平台' }]}
            >
              <Select>
                <Select.Option value="闲鱼">闲鱼</Select.Option>
                <Select.Option value="淘宝">淘宝</Select.Option>
              </Select>
            </Form.Item>
          </div>

          <Form.Item
            name={['features', 'priceAdjustment']}
            label="价格调整"
            tooltip="商品价格的上浮比例，0.1 表示上浮 10%"
          >
            <InputNumber
              min={0}
              max={1}
              step={0.1}
              style={{ width: '100%' }}
              placeholder="请输入价格调整比例"
            />
          </Form.Item>
        </Card>

        {/* 商品模板 */}
        <Card 
          title="商品模板" 
          className="shadow-sm"
          extra={
            <Button
              type="primary"
              onClick={() => {
                setCurrentTemplate(undefined);
                setIsTemplateModalVisible(true);
              }}
            >
              添加模板
            </Button>
          }
        >
          <div className="space-y-4">
            {templates.map(template => (
              <Card
                key={template.id}
                size="small"
                title={
                  <Space>
                    {template.name}
                    {template.isDefault && <Tag color="blue">默认</Tag>}
                  </Space>
                }
                extra={
                  <Space>
                    {!template.isDefault && (
                      <Button
                        type="link"
                        size="small"
                        onClick={() => handleSetDefaultTemplate(template.id)}
                      >
                        设为默认
                      </Button>
                    )}
                    <Button
                      type="link"
                      size="small"
                      onClick={() => {
                        setCurrentTemplate(template);
                        setIsTemplateModalVisible(true);
                      }}
                    >
                      编辑
                    </Button>
                    <Button
                      type="link"
                      danger
                      size="small"
                      onClick={() => handleDeleteTemplate(template.id)}
                    >
                      删除
                    </Button>
                  </Space>
                }
              >
                <div className="space-y-2">
                  <div>
                    <div className="text-gray-500 mb-1">标题模板：</div>
                    <div className="bg-gray-50 p-2 rounded">{template.title}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 mb-1">文案模板：</div>
                    <div className="bg-gray-50 p-2 rounded whitespace-pre-wrap">{template.description}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Card>
      </Form>

      {/* 模板编辑弹窗 */}
      <Modal
        title={currentTemplate ? '编辑模板' : '添加模板'}
        open={isTemplateModalVisible}
        onCancel={() => {
          setIsTemplateModalVisible(false);
          setCurrentTemplate(undefined);
        }}
        footer={null}
        width={600}
      >
        <TemplateForm
          initialValues={currentTemplate}
          onSubmit={handleTemplateSubmit}
          onCancel={() => {
            setIsTemplateModalVisible(false);
            setCurrentTemplate(undefined);
          }}
        />
      </Modal>
    </div>
  );
};

const Settings: React.FC = () => {
  const { 
    storeAccounts = mockStores, 
    storeGroups = mockGroups,
    productSettings, 
    addStoreAccount, 
    removeStoreAccount,
    updateStoreAccount,
    updateProductSettings,
    addCategory,
    removeCategory,
    addStoreGroup,
    updateStoreGroup,
    removeStoreGroup,
  } = useSettingsStore();

  const [newCategory, setNewCategory] = useState('');
  const [isGroupModalVisible, setIsGroupModalVisible] = useState(false);
  const [currentGroup, setCurrentGroup] = useState<StoreGroup | undefined>();
  const [groupForm] = Form.useForm();
  const [isStoreModalVisible, setIsStoreModalVisible] = useState(false);
  const [currentStore, setCurrentStore] = useState<StoreAccount | undefined>();
  const [storeForm] = Form.useForm();

  // 处理添加/编辑店铺
  const handleEditStore = (store?: StoreAccount) => {
    setCurrentStore(store);
    if (store && storeForm) {
      storeForm.setFieldsValue({
        name: store.name,
        platform: store.platform,
        features: {
          priceAdjustment: store.features.priceAdjustment,
          templates: store.features.templates || []
        }
      });
    } else {
      storeForm?.resetFields();
    }
    setIsStoreModalVisible(true);
  };

  // 处理删除店铺
  const handleDeleteStore = (store: StoreAccount) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除店铺"${store.name}"吗？`,
      onOk: () => {
        removeStoreAccount(store.id);
        message.success('删除成功');
      },
    });
  };

  // 保存店铺
  const handleSaveStore = async (values: StoreAccount) => {
    try {
      const storeInfo = {
        id: currentStore?.id || uuidv4(),
        name: values.name,
        platform: values.platform,
        features: {
          priceAdjustment: values.features?.priceAdjustment || 0,
          templates: values.features?.templates || []
        }
      };

      if (currentStore) {
        updateStoreAccount(currentStore.id, storeInfo);
        message.success('编辑成功');
      } else {
        addStoreAccount(storeInfo);
        message.success('添加成功');
      }
      setIsStoreModalVisible(false);
      storeForm.resetFields();
      setCurrentStore(undefined);
    } catch (error) {
      console.error('保存店铺失败:', error);
      message.error('保存失败，请重试');
    }
  };

  // 店铺表格列配置
  const storeColumns = [
    {
      title: '店铺名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '平台',
      dataIndex: 'platform',
      key: 'platform',
    },
    {
      title: '价格系数',
      dataIndex: ['features', 'priceAdjustment'],
      key: 'priceAdjustment',
      render: (value: number) => `${(value * 100).toFixed(0)}%`,
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: StoreAccount) => (
        <Space size="middle">
          <Button type="link" onClick={() => handleEditStore(record)}>
            <EditOutlined /> 编辑
          </Button>
          <Button type="link" danger onClick={() => handleDeleteStore(record)}>
            <DeleteOutlined /> 删除
          </Button>
        </Space>
      ),
    },
  ];

  // 处理添加分类
  const handleAddCategory = () => {
    if (!newCategory.trim()) {
      message.warning('请输入分类名称');
      return;
    }
    if (productSettings?.categories?.includes(newCategory.trim())) {
      message.warning('该分类已存在');
      return;
    }
    addCategory(newCategory.trim());
    setNewCategory('');
    message.success('添加成功');
  };

  // 处理删除分类
  const handleRemoveCategory = (category: string, e?: React.MouseEvent<HTMLElement, MouseEvent>) => {
    e?.preventDefault();
    e?.stopPropagation();
    
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除分类"${category}"吗？`,
      onOk: () => {
        removeCategory(category);
        message.success('删除成功');
      },
    });
  };

  // 处理按键事件
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddCategory();
    }
  };

  // 处理添加/编辑店铺组
  const handleEditGroup = (group?: StoreGroup) => {
    setCurrentGroup(group);
    if (group) {
      groupForm.setFieldsValue(group);
    } else {
      groupForm.resetFields();
    }
    setIsGroupModalVisible(true);
  };

  // 处理删除店铺组
  const handleDeleteGroup = (group: StoreGroup) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除店铺组"${group.name}"吗？`,
      onOk: () => {
        removeStoreGroup(group.id);
        message.success('删除成功');
      },
    });
  };

  // 保存店铺组
  const handleSaveGroup = async () => {
    try {
      const values = await groupForm.validateFields();
      if (currentGroup) {
        updateStoreGroup(currentGroup.id, values);
        message.success('编辑成功');
      } else {
        addStoreGroup({
          id: uuidv4(),
          ...values,
        });
        message.success('添加成功');
      }
      setIsGroupModalVisible(false);
      groupForm.resetFields();
      setCurrentGroup(undefined);
    } catch (error) {
      // 表单验证错误
    }
  };

  // 店铺组表格列配置
  const groupColumns = [
    {
      title: '组名',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '包含店铺',
      dataIndex: 'storeIds',
      key: 'storeIds',
      render: (storeIds: string[]) => (
        <span>
          {storeIds.map(id => {
            const store = storeAccounts.find(s => s.id === id);
            return store ? store.name : '';
          }).filter(Boolean).join(', ')}
        </span>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: StoreGroup) => (
        <Space size="middle">
          <Button type="link" onClick={() => handleEditGroup(record)}>
            <EditOutlined /> 编辑
          </Button>
          <Button type="link" danger onClick={() => handleDeleteGroup(record)}>
            <DeleteOutlined /> 删除
          </Button>
        </Space>
      ),
    },
  ];

  // 发货方式设置组件
  const DeliveryMethodSettings: React.FC = () => {
    const { productSettings, updateProductSettings } = useSettingsStore();
    const { deliveryMethods = [] } = productSettings;

    const handleToggleMethod = (methodId: string) => {
      const currentMethods = [...deliveryMethods];
      const enabledCount = currentMethods.filter(m => m.isEnabled).length;
      const isCurrentEnabled = currentMethods.find(m => m.id === methodId)?.isEnabled;
      
      if (enabledCount === 1 && isCurrentEnabled) {
        message.warning('至少需要保留一种发货方式');
        return;
      }
      
      const updatedMethods = currentMethods.map(m =>
        m.id === methodId ? { ...m, isEnabled: !m.isEnabled } : m
      );
      
      updateProductSettings({
        deliveryMethods: updatedMethods,
      });
    };

    return (
      <div>
        <div className="flex flex-wrap gap-2 mb-4">
          {deliveryMethods.map(method => (
            <Tag
              key={method.id}
              color={method.isEnabled ? 'blue' : 'default'}
              className="text-base py-1 px-3 cursor-pointer"
              onClick={() => handleToggleMethod(method.id)}
            >
              {method.name}
            </Tag>
          ))}
        </div>
        <div className="text-gray-500 text-sm">
          点击标签可以启用/禁用对应的发货方式，至少需要保留一种发货方式
        </div>
      </div>
    );
  };

  return (
    <div className="p-6">
      <Tabs defaultActiveKey="store">
        <TabPane tab="店铺账号" key="store">
          <div className="space-y-6">
            <Card title="店铺管理" className="shadow-sm">
              <div className="mb-4">
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />} 
                  onClick={() => handleEditStore()}
                >
                  新增店铺
                </Button>
              </div>
              <Table
                columns={storeColumns}
                dataSource={storeAccounts}
                rowKey="id"
                pagination={false}
              />
            </Card>

            <Card title="店铺组管理" className="shadow-sm">
              <div className="mb-4">
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />} 
                  onClick={() => handleEditGroup()}
                >
                  新增店铺组
                </Button>
              </div>
              <Table
                columns={groupColumns}
                dataSource={storeGroups}
                rowKey="id"
                pagination={false}
              />
            </Card>
          </div>
        </TabPane>

        <TabPane tab="商品设置" key="product">
          <div className="space-y-6">
            <Card title="商品分类设置" className="shadow-sm">
              <div className="space-y-4">
                <div className="flex gap-4">
                  <Input
                    placeholder="请输入分类名称"
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value)}
                    onKeyPress={handleKeyPress}
                    style={{ width: 200 }}
                    maxLength={20}
                  />
                  <Button 
                    type="primary" 
                    icon={<PlusOutlined />} 
                    onClick={handleAddCategory}
                    disabled={!newCategory.trim()}
                  >
                    添加分类
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {productSettings?.categories?.map(category => (
                    <Tag
                      key={category}
                      closable
                      onClose={(e) => handleRemoveCategory(category, e)}
                      className="text-base py-1 px-3"
                    >
                      {category}
                    </Tag>
                  ))}
                </div>
              </div>
            </Card>

            <Card title="发货方式设置" className="shadow-sm">
              <DeliveryMethodSettings />
            </Card>

            <Card title="分配设置" className="shadow-sm">
              <Form
                layout="vertical"
                initialValues={productSettings?.distributeSettings}
                onValuesChange={(_, values) => {
                  updateProductSettings({
                    distributeSettings: values,
                  });
                }}
              >
                <Form.Item
                  name={['defaultStatus']}
                  label="默认分配状态"
                >
                  <Select
                    options={[
                      { label: '草稿', value: 'draft' },
                      { label: '待审核', value: 'pending' },
                      { label: '待上架', value: 'ready' },
                    ]}
                  />
                </Form.Item>

                <Form.Item
                  name={['priceStrategy', 'useAccountAdjustment']}
                  label="使用店铺价格系数"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>

                <Form.Item
                  name={['priceStrategy', 'roundingRule']}
                  label="价格取整规则"
                >
                  <Select
                    options={[
                      { label: '向上取整', value: 'up' },
                      { label: '向下取整', value: 'down' },
                      { label: '四舍五入', value: 'nearest' },
                    ]}
                  />
                </Form.Item>

                <Form.Item
                  name={['priceStrategy', 'minimumMargin']}
                  label="最小利润率"
                >
                  <InputNumber<number>
                    style={{ width: '100%' }}
                    min={0}
                    max={1}
                    step={0.01}
                    formatter={value => `${(value || 0) * 100}%`}
                    parser={value => {
                      const num = parseFloat((value || '').replace('%', ''));
                      return isNaN(num) ? 0 : Math.min(Math.max(num / 100, 0), 1);
                    }}
                  />
                </Form.Item>

                <Form.Item
                  name={['enableSmartContent']}
                  label="启用智能文案"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
              </Form>
            </Card>
          </div>
        </TabPane>
      </Tabs>

      {/* 店铺表单弹窗 */}
      <Modal
        title={currentStore ? '编辑店铺' : '新增店铺'}
        open={isStoreModalVisible}
        onOk={() => storeForm.submit()}
        onCancel={() => {
          setIsStoreModalVisible(false);
          storeForm.resetFields();
          setCurrentStore(undefined);
        }}
      >
        <StoreForm
          form={storeForm}
          initialValues={currentStore}
          onSubmit={handleSaveStore}
          onCancel={() => {
            setIsStoreModalVisible(false);
            storeForm.resetFields();
            setCurrentStore(undefined);
          }}
        />
      </Modal>

      {/* 店铺组表单弹窗 */}
      <Modal
        title={currentGroup ? '编辑店铺组' : '新增店铺组'}
        open={isGroupModalVisible}
        onOk={handleSaveGroup}
        onCancel={() => {
          setIsGroupModalVisible(false);
          groupForm.resetFields();
          setCurrentGroup(undefined);
        }}
      >
        <Form form={groupForm} layout="vertical">
          <Form.Item
            name="name"
            label="组名"
            rules={[{ required: true, message: '请输入组名' }]}
          >
            <Input placeholder="请输入组名" />
          </Form.Item>
          <Form.Item
            name="storeIds"
            label="选择店铺"
            rules={[{ required: true, message: '请选择至少一个店铺' }]}
          >
            <Select
              mode="multiple"
              placeholder="请选择店铺"
              options={storeAccounts.map(store => ({
                label: `${store.name} (${store.platform})`,
                value: store.id,
              }))}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Settings; 