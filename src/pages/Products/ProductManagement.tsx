import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Input, Space, message, Select, Tag, Modal, Image, DatePicker, Popover, Dropdown } from 'antd';
import { PlusOutlined, EditOutlined, StopOutlined, CalendarOutlined, ExportOutlined, DeleteOutlined, DownOutlined } from '@ant-design/icons';
import EditProductForm from './EditProductForm';
import type { Product, ProductSelection, ProductSourceStatus, ProductStatus, ProductCategory } from '../../types/product';
import useProductStore from '../../store/productStore';
import useSettingsStore from '../../store/settingsStore';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';

const { Search } = Input;
const { RangePicker } = DatePicker;

// 添加 File System Access API 的类型声明
declare global {
  interface Window {
    showDirectoryPicker(options?: { mode?: 'read' | 'readwrite' }): Promise<FileSystemDirectoryHandle>;
  }
}

// 将Product类型转换为ProductSelection类型
const convertProductToSelection = (product: Product): ProductSelection => {
  console.log('Converting product to selection:', product);
  return {
    ...product,
    status: 'pending',
    source_status: product.source === 'manual' ? 'manual' : 'crawler_success' as ProductSourceStatus,
  };
};

// 将ProductSelection类型转换为Product类型
const convertSelectionToProduct = (selection: any, originalProduct: Product): Product => {
  return {
    ...originalProduct,
    ...selection,
    lastUpdated: new Date().toISOString(),
  };
};

const ProductManagement: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProductStatus | ''>('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selectedRows, setSelectedRows] = useState<Product[]>([]);
  
  // 使用 store
  const { products, updateProduct, addProducts, removeProduct, updateDeliveryMethods } = useProductStore();
  const { productSettings, storeAccounts } = useSettingsStore();

  // 更新发货方式格式
  useEffect(() => {
    updateDeliveryMethods();
  }, []);

  // 过滤和搜索商品
  const getFilteredProducts = () => {
    let filteredData = [...products];
    
    // 搜索过滤
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      filteredData = filteredData.filter(item => 
        item.name.toLowerCase().includes(searchLower) ||
        item.distributedTitle?.toLowerCase().includes(searchLower)
      );
    }

    // 状态筛选
    if (statusFilter) {
      filteredData = filteredData.filter(item => item.status === statusFilter);
    }

    // 分类筛选
    if (categoryFilter) {
      filteredData = filteredData.filter(item => item.category === categoryFilter);
    }

    // 日期范围筛选
    if (dateRange && dateRange[0] && dateRange[1]) {
      filteredData = filteredData.filter(item => {
        const createdAt = dayjs(item.createdAt);
        return createdAt.isAfter(dateRange[0], 'day') && createdAt.isBefore(dateRange[1], 'day');
      });
    }

    return filteredData;
  };

  // 日期快选项
  const dateRangePresets: {
    label: string;
    value: [Dayjs, Dayjs];
  }[] = [
    { label: '最近7天', value: [dayjs().subtract(7, 'd'), dayjs()] },
    { label: '最近30天', value: [dayjs().subtract(30, 'd'), dayjs()] },
    { label: '本月', value: [dayjs().startOf('month'), dayjs().endOf('month')] },
    { label: '上月', value: [dayjs().subtract(1, 'month').startOf('month'), dayjs().subtract(1, 'month').endOf('month')] },
  ];

  // 日期筛选内容
  const dateFilterContent = (
    <div style={{ padding: '8px 0' }}>
      <RangePicker
        value={dateRange}
        onChange={(dates) => setDateRange(dates)}
        presets={dateRangePresets}
        allowClear
      />
    </div>
  );

  // 监听products变化
  useEffect(() => {
    console.log('Current products:', products);
  }, [products]);

  // 处理编辑
  const handleEdit = (record: Product) => {
    console.log('Editing product:', record);
    try {
      setSelectedProduct(record);
      setIsEditModalVisible(true);
      console.log('Edit modal should be visible now');
    } catch (error) {
      console.error('Error in handleEdit:', error);
    }
  };

  // 监听Modal和选中商品的变化
  useEffect(() => {
    console.log('Modal visible:', isEditModalVisible);
    console.log('Selected product:', selectedProduct);
    if (isEditModalVisible && selectedProduct) {
      console.log('Converting product to selection:', selectedProduct);
      const selection = convertProductToSelection(selectedProduct);
      console.log('Converted selection:', selection);
    }
  }, [isEditModalVisible, selectedProduct]);

  // 处理编辑提交
  const handleEditSubmit = async (values: any) => {
    try {
      if (!selectedProduct) return;
      
      console.log('Submitting edit with values:', values);
      
      // 将编辑后的据转换回Product类型
      const updatedProduct = convertSelectionToProduct(values, selectedProduct);
      
      // 更新商品数据
      updateProduct(updatedProduct);
      message.success('编辑成功');
      setIsEditModalVisible(false);
      setSelectedProduct(null);
    } catch (error) {
      console.error('Edit failed:', error);
      message.error('编辑失败');
    }
  };

  // 处理下架
  const handleOffline = (record: Product) => {
    Modal.confirm({
      title: '确认下架',
      content: `确定要下架商品"${record.name}"吗？`,
      onOk: async () => {
        try {
          updateProduct({
            ...record,
            status: 'offline',
            lastUpdated: new Date().toISOString()
          });
          message.success('下架成功');
        } catch (error) {
          message.error('下架失败');
        }
      }
    });
  };

  // 处理新增商品
  const handleAdd = () => {
    const newProduct: Product = {
      id: `new-${Date.now()}`,
      name: '新商品',
      category: '电子书' as ProductCategory,
      description: '',
      price: 0,
      stock: 0,
      createdAt: new Date().toISOString(),
      source: 'manual',
      hasSpecs: false,
      selectionId: `new-${Date.now()}`,
      storeId: '1',
      templateId: '1',
      status: 'draft',
      distributedAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      distributedTitle: '新商品',
      distributedContent: ''
    };
    setSelectedProduct(newProduct);
    setIsEditModalVisible(true);
  };

  // 处理多选
  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedKeys: React.Key[], selectedItems: Product[]) => {
      setSelectedRowKeys(selectedKeys);
      setSelectedRows(selectedItems);
    }
  };

  // 处理批量下架
  const handleBatchOffline = () => {
    Modal.confirm({
      title: '确认下架',
      content: `确定要下架选中的 ${selectedRowKeys.length} 个商品吗？`,
      onOk: async () => {
        try {
          selectedRows.forEach(product => {
            updateProduct({
              ...product,
              status: 'offline',
              lastUpdated: new Date().toISOString()
            });
          });
          message.success('批量下架成功');
          setSelectedRowKeys([]);
          setSelectedRows([]);
        } catch (error) {
          message.error('批量下架失败');
        }
      }
    });
  };

  // 处理批量删除
  const handleBatchDelete = () => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除选中的 ${selectedRowKeys.length} 个商品吗？此操作不可恢复！`,
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          selectedRows.forEach(product => {
            removeProduct(product.id);
          });
          message.success('批量删除成功');
          setSelectedRowKeys([]);
          setSelectedRows([]);
        } catch (error) {
          message.error('批量删除失败');
        }
      }
    });
  };

  // 处理图片保存
  const saveImage = async (imageUrl: string, folderHandle: FileSystemDirectoryHandle, fileName: string) => {
    try {
      console.log(`开始保存图片: ${fileName}, URL: ${imageUrl}`);
      let blob: Blob;
      
      // 检查是否是 base64 图片
      if (imageUrl.startsWith('data:image')) {
        console.log(`${fileName} 是 base64 图片`);
        // 将 base64 转换为 blob
        const response = await fetch(imageUrl);
        blob = await response.blob();
      } else {
        console.log(`${fileName} 是 URL 图片`);
        // 普通 URL 图片
        try {
          const response = await fetch(imageUrl, {
            mode: 'cors',
            headers: {
              'Access-Control-Allow-Origin': '*'
            }
          });
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          blob = await response.blob();
          console.log(`${fileName} 获取成功，大小: ${blob.size} 字节`);
        } catch (error) {
          console.error(`获取图片失败: ${imageUrl}`, error);
          message.error(`获取图片失败: ${fileName}`);
          return;
        }
      }

      // 保存图片文件
      const imageFileHandle = await folderHandle.getFileHandle(fileName, { create: true });
      const imageWritable = await imageFileHandle.createWritable();
      await imageWritable.write(blob);
      await imageWritable.close();

      console.log(`图片保存成功: ${fileName}`);
    } catch (error) {
      console.error(`保存图片失败: ${fileName}`, error);
      message.error(`保存图片失败: ${fileName}`);
    }
  };

  // 处理批量导出
  const handleBatchExport = async () => {
    try {
      // 请求用户选择导出目录
      const dirHandle = await window.showDirectoryPicker({
        mode: 'readwrite'
      });

      // 为每个选中的商品创建文件夹和文件
      for (const product of selectedRows) {
        try {
          console.log('开始导出商品:', product);
          
          // 获取店铺信息
          const store = storeAccounts.find(store => store.id === product.storeId);
          const storeName = store?.name || '未知店铺';
          
          // 创建商品文件夹（格式：商品名称【店铺名称】）
          const folderName = `${product.name}【${storeName}】`.replace(/[\\/:*?"<>|]/g, '_');
          console.log('创建文件夹:', folderName);
          const folderHandle = await dirHandle.getDirectoryHandle(folderName, { create: true });

          // 创建并写入各个信息文件
          const files: Record<string, string> = {
            '商品名称.txt': product.name || '',
            '分类.txt': product.category || '',
            '价格.txt': product.price?.toString() || '0',
            '库存.txt': product.stock?.toString() || '0',
            '状态.txt': product.status === 'draft' ? '草稿' : 
                      product.status === 'published' ? '已发布' : 
                      product.status === 'pending' ? '待发布' :
                      product.status === 'failed' ? '发布失败' : '已下架',
            '商品标题.txt': product.distributedTitle || '',
            '商品描述.txt': product.distributedContent || '',
            '发布店铺.txt': `店铺名称：${storeName}\n平台：${store?.platform || '未知平台'}`
          };

          // 如果有发货方式和发货信息，添加对应的文件
          if (product.deliveryMethod) {
            const deliveryFileName = `${product.deliveryMethod}.txt`;
            files[deliveryFileName] = product.deliveryInfo || '';
          }

          // 写入所有文本文件
          for (const [fileName, content] of Object.entries(files)) {
            const fileHandle = await folderHandle.getFileHandle(fileName, { create: true });
            const writable = await fileHandle.createWritable();
            await writable.write(new TextEncoder().encode(content));
            await writable.close();
          }

          // 创建图片文件夹
          console.log('创建图片文件夹');
          const imagesFolderHandle = await folderHandle.getDirectoryHandle('图片', { create: true });

          // 保存封面图片
          if (product.coverImage) {
            console.log('发现封面图片:', product.coverImage);
            await saveImage(product.coverImage, imagesFolderHandle, '封面图片.jpg');
          } else {
            console.log('没有封面图片');
          }

          // 保存公共图片
          if (product.commonImages && product.commonImages.length > 0) {
            console.log(`发现 ${product.commonImages.length} 张公共图片`);
            for (let i = 0; i < product.commonImages.length; i++) {
              const image = product.commonImages[i];
              if (image.url) {
                console.log(`处理第 ${i + 1} 张公共图片:`, image.url);
                await saveImage(image.url, imagesFolderHandle, `公共图片_${i + 1}.jpg`);
              } else {
                console.log(`第 ${i + 1} 张公共图片没有 URL`);
              }
            }
          } else {
            console.log('没有公共图片');
          }

          console.log(`商品导出成功: ${product.name}`);
        } catch (error) {
          console.error(`导出商品失败: ${product.name}`, error);
          message.error(`导出商品失败: ${product.name}`);
        }
      }

      message.success('导出完成');
    } catch (error) {
      console.error('Export error:', error);
      if (error instanceof Error && error.name === 'SecurityError') {
        message.error('请允许访问文件系统权限');
      } else {
        message.error('导出失败');
      }
    }
  };

  // 批量操作菜单项
  const batchOperationItems = {
    items: [
      {
        key: 'export',
        label: (
          <Button type="text" icon={<ExportOutlined />} onClick={handleBatchExport}>
            批量导出
          </Button>
        )
      },
      {
        key: 'offline',
        label: (
          <Button type="text" danger icon={<StopOutlined />} onClick={handleBatchOffline}>
            批量下架
          </Button>
        )
      },
      {
        key: 'delete',
        label: (
          <Button type="text" danger icon={<DeleteOutlined />} onClick={handleBatchDelete}>
            批量删除
          </Button>
        )
      }
    ]
  };

  const columns: ColumnsType<Product> = [
    {
      title: '商品信息',
      key: 'productInfo',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          {record.distributedTitle && (
            <span className="text-gray-500">{record.distributedTitle}</span>
          )}
          <Space>
            <span className="font-medium">{record.name}</span>
            <Tag>{record.category}</Tag>
          </Space>
        </Space>
      ),
    },
    {
      title: '店铺',
      key: 'store',
      width: 150,
      render: (_, record) => {
        const store = storeAccounts.find(store => store.id === record.storeId);
        return (
          <Space direction="vertical" size={0}>
            <span>{store?.name || '未知店铺'}</span>
            <Tag color="blue">{store?.platform || '未知平台'}</Tag>
          </Space>
        );
      },
      filters: storeAccounts.map(store => ({
        text: store.name,
        value: store.id,
      })),
      onFilter: (value, record) => record.storeId === value,
    },
    {
      title: '头图',
      key: 'coverImage',
      width: 120,
      render: (_, record) => (
        record.coverImage ? (
          <Image
            src={record.coverImage}
            alt="商品头图"
            width={80}
            height={80}
            style={{ objectFit: 'cover' }}
          />
        ) : null
      ),
    },
    {
      title: '价格/库存',
      key: 'priceAndStock',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <span className="font-medium text-lg">¥{record.price?.toFixed(2) || '0.00'}</span>
          <span className="text-gray-500">库存: {record.stock || 0}</span>
        </Space>
      ),
      sorter: (a, b) => {
        // 首先按价格排序
        if (a.price !== b.price) {
          return a.price - b.price;
        }
        // 价格相同时按库存排序
        return a.stock - b.stock;
      },
      sortDirections: ['ascend', 'descend'],
    },
    {
      title: '状态',
      key: 'status',
      render: (_, record) => {
        const statusMap = {
          draft: { color: 'default', text: '草稿' },
          pending: { color: 'processing', text: '待发布' },
          published: { color: 'success', text: '已发布' },
          failed: { color: 'error', text: '发布失败' },
          offline: { color: 'default', text: '已下架' },
        };
        const { color, text } = statusMap[record.status];
        return (
          <Space direction="vertical" size={0}>
            <Tag color={color}>{text}</Tag>
            {record.publishedAt && (
              <span className="text-gray-500 text-xs">
                发布于 {dayjs(record.publishedAt).format('YYYY-MM-DD HH:mm')}
              </span>
            )}
          </Space>
        );
      },
      filters: [
        { text: '草稿', value: 'draft' },
        { text: '待发布', value: 'pending' },
        { text: '已发布', value: 'published' },
        { text: '发布失败', value: 'failed' },
        { text: '已下架', value: 'offline' },
      ],
      onFilter: (value, record) => record.status === value,
      sorter: (a, b) => a.status.localeCompare(b.status),
      sortDirections: ['ascend', 'descend'],
    },
    {
      title: (
        <Space>
          创建时间
          <Popover 
            content={dateFilterContent}
            trigger="click"
            placement="bottom"
            title="选择日期范围"
          >
            <Button
              type="text"
              icon={<CalendarOutlined style={{ color: '#8c8c8c' }} />}
              size="small"
            />
          </Popover>
        </Space>
      ),
      key: 'createdAt',
      render: (_, record) => dayjs(record.createdAt).format('YYYY-MM-DD HH:mm'),
      sorter: (a, b) => dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix(),
      sortDirections: ['ascend', 'descend'],
      defaultSortOrder: 'descend',
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_, record) => (
        <Space size="middle">
          <Button 
            type="link" 
            onClick={() => handleEdit(record)}
          >
            <EditOutlined />
            编辑
          </Button>
          {record.status !== 'offline' && (
            <Button 
              type="link" 
              danger 
              onClick={() => handleOffline(record)}
            >
              <StopOutlined />
              下架
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex justify-between mb-4">
          <Space>
            {selectedRowKeys.length > 0 && (
              <Dropdown menu={batchOperationItems} placement="bottomLeft">
                <Button>
                  <Space>
                    批量操作
                    <DownOutlined />
                  </Space>
                </Button>
              </Dropdown>
            )}
            <Select
              placeholder="商品状态"
              style={{ width: 120 }}
              value={statusFilter}
              onChange={setStatusFilter}
              allowClear
              options={[
                { label: '全部状态', value: '' },
                { label: '草稿', value: 'draft' },
                { label: '待发布', value: 'pending' },
                { label: '已发布', value: 'published' },
                { label: '发布失败', value: 'failed' },
                { label: '已下架', value: 'offline' },
              ]}
            />
            <Select
              placeholder="商品分类"
              style={{ width: 120 }}
              value={categoryFilter}
              onChange={setCategoryFilter}
              allowClear
              options={[
                { label: '全部分类', value: '' },
                ...(productSettings?.categories?.map(category => ({
                  label: category,
                  value: category,
                })) || [])
              ]}
            />
          </Space>
          <Search
            placeholder="搜索商品名称/分标题"
            style={{ width: 300 }}
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            allowClear
          />
        </div>

        <Table
          rowSelection={rowSelection}
          columns={columns}
          dataSource={getFilteredProducts()}
          rowKey="id"
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
          loading={loading}
        />
      </Card>
      
      {/* 编辑弹窗 */}
      <Modal
        title="编辑商品"
        open={isEditModalVisible}
        onCancel={() => {
          console.log('Closing modal');
          setIsEditModalVisible(false);
          setSelectedProduct(null);
        }}
        footer={null}
        width={800}
        centered
        destroyOnClose
      >
        {selectedProduct ? (
          <>
            {console.log('Rendering EditProductForm with product:', selectedProduct)}
            <EditProductForm
              initialValues={convertProductToSelection(selectedProduct)}
              onSubmit={handleEditSubmit}
              onCancel={() => {
                console.log('Canceling edit');
                setIsEditModalVisible(false);
                setSelectedProduct(null);
              }}
            />
          </>
        ) : (
          <div>No product selected</div>
        )}
      </Modal>
    </div>
  );
};

export default ProductManagement; 