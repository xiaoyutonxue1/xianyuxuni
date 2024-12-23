import React, { useState, useMemo } from 'react';
import { Card, Table, Button, Input, Space, Tag, Modal, Form, Select, message, Tooltip, InputNumber, Dropdown } from 'antd';
import { EditOutlined, DeleteOutlined, CopyOutlined, ExportOutlined, DownOutlined } from '@ant-design/icons';
import { calculateCompleteness } from '../../utils/productCompleteness';
import EditProductForm from './EditProductForm';
import type { Product } from '../../types/product';

const { Search } = Input;

// 添加完整度筛选选项
const completenessOptions = [
  { label: '全部完整度', value: '' },
  { label: '100% 完整', value: '100' },
  { label: '80-99% 较完整', value: '80-99' },
  { label: '60-79% 部分完整', value: '60-79' },
  { label: '60% 以下 待完善', value: '0-59' }
];

const ProductListing: React.FC = () => {
  const [currentItem, setCurrentItem] = useState<Product>();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [completenessFilter, setCompletenessFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Product[]>([]);

  // 修改筛选逻辑
  const filteredData = useMemo(() => {
    let result = [...data];

    // 应用完整度筛选
    if (completenessFilter) {
      switch (completenessFilter) {
        case '100':
          result = result.filter(item => calculateCompleteness(item) === 100);
          break;
        case '80-99':
          result = result.filter(item => {
            const completeness = calculateCompleteness(item);
            return completeness >= 80 && completeness < 100;
          });
          break;
        case '60-79':
          result = result.filter(item => {
            const completeness = calculateCompleteness(item);
            return completeness >= 60 && completeness < 80;
          });
          break;
        case '0-59':
          result = result.filter(item => calculateCompleteness(item) < 60);
          break;
      }
    }

    // 应用搜索筛选
    if (searchText) {
      result = result.filter(item => 
        item.name?.toLowerCase().includes(searchText.toLowerCase()) ||
        item.category?.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    return result;
  }, [data, completenessFilter, searchText]);

  // 表格列定义
  const columns = [
    {
      title: '商品信息',
      key: 'productInfo',
      render: (_: any, record: Product) => (
        <Space direction="vertical" size={0}>
          <span className="font-medium">{record.name}</span>
          {record.category && <Tag>{record.category}</Tag>}
        </Space>
      ),
    },
    {
      title: '价格/库存',
      key: 'priceAndStock',
      render: (_: any, record: Product) => (
        <Space direction="vertical" size={0}>
          <span>¥{record.price}</span>
          <span className="text-gray-500">库存: {record.stock}</span>
        </Space>
      ),
    },
    {
      title: '发货方式',
      dataIndex: 'deliveryMethod',
      key: 'deliveryMethod',
    },
    {
      title: '完整度',
      key: 'completeness',
      render: (_: any, record: Product) => {
        const percent = calculateCompleteness(record);
        let color = 'default';
        if (percent === 100) color = 'success';
        else if (percent >= 80) color = 'processing';
        else if (percent >= 60) color = 'warning';
        else color = 'error';
        
        return (
          <Tag color={color}>
            {percent}%
          </Tag>
        );
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Product) => (
        <Space size="middle">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => {
              setCurrentItem(record);
              setIsModalVisible(true);
            }}
          >
            编辑
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => {
              // 处理删除逻辑
            }}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  // 渲染编辑弹窗
  const renderEditModal = () => {
    if (!currentItem) return null;

    return (
      <Modal
        title="编辑商品"
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          setCurrentItem(undefined);
        }}
        footer={null}
        width={800}
      >
        <EditProductForm
          initialValues={currentItem}
          onSubmit={async (values) => {
            // 处理提交逻辑
            setIsModalVisible(false);
            setCurrentItem(undefined);
          }}
          onCancel={() => {
            setIsModalVisible(false);
            setCurrentItem(undefined);
          }}
        />
      </Modal>
    );
  };

  return (
    <div className="p-6">
      <Card>
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2">
            <Search
              placeholder="搜索商品"
              style={{ width: 200 }}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onSearch={setSearchText}
            />
            <Select
              placeholder="完整度"
              style={{ width: 160 }}
              value={completenessFilter}
              onChange={setCompletenessFilter}
              allowClear
              options={completenessOptions}
            />
          </div>
          <Space>
            <Button type="primary" onClick={() => setIsModalVisible(true)}>
              新增商品
            </Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={filteredData}
          loading={loading}
          rowKey="id"
        />
      </Card>
      
      {renderEditModal()}
    </div>
  );
};

export default ProductListing; 