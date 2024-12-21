import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Space, Table, Progress, DatePicker, Alert, Badge, Tooltip, Tag, Select } from 'antd';
import { Area, Pie } from '@ant-design/plots';
import { 
  ShoppingOutlined, 
  ShopOutlined,
  AppstoreOutlined,
  AlertOutlined,
  RiseOutlined,
  FallOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import useProductStore from '../store/productStore';
import useSettingsStore from '../store/settingsStore';
import type { Product, ProductStatus, ProductCategory } from '../types/product';

const { RangePicker } = DatePicker;

const Dashboard: React.FC = () => {
  const products = useProductStore((state) => state.products);
  const { productSettings, storeAccounts } = useSettingsStore();
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(30, 'days'),
    dayjs()
  ]);
  const [selectedStore, setSelectedStore] = useState<string>('all');
  const [selectedTimeRange, setSelectedTimeRange] = useState<'7d' | '30d' | '90d' | '180d' | '365d'>('30d');

  // 过滤当前选中店铺���商品
  const filteredProducts = selectedStore === 'all' 
    ? products 
    : products.filter(p => p.storeId === selectedStore);

  // 计算核心指标
  const stats = {
    total: filteredProducts.length,
    published: filteredProducts.filter(p => p.status === 'published').length,
    pending: filteredProducts.filter(p => p.status === 'pending').length,
    failed: filteredProducts.filter(p => p.status === 'failed').length,
    storeCount: new Set(products.map(p => p.storeId)).size,
    categoryCount: new Set(products.map(p => p.category)).size,
    selectionCount: new Set(products.map(p => p.selectionId)).size,
    completeness: filteredProducts.filter(p => (p.completeness || 0) >= 80).length,
  };

  // 生成每日数据
  const getDailyData = () => {
    const ranges: Record<typeof selectedTimeRange, number> = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '180d': 180,
      '365d': 365,
    };
    const days = ranges[selectedTimeRange];
    
    // 从实际数据中统计每日新增数量
    return Array.from({ length: days }, (_, i) => {
      const date = dayjs().subtract(days - 1 - i, 'days').format('YYYY-MM-DD');
      const dayStart = dayjs(date).startOf('day');
      const dayEnd = dayjs(date).endOf('day');
      
      // 统计当天创建的商品数量
      const selections = products.filter(p => {
        const createdTime = dayjs(p.createdAt);
        return createdTime.isAfter(dayStart) && createdTime.isBefore(dayEnd);
      }).length;

      return {
        date,
        selections
      };
    });
  };

  const dailyData = getDailyData();

  // 计算环比增长
  const getGrowthRate = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous * 100).toFixed(1);
  };

  // 异常预警数据
  const warnings = [
    { type: 'error', message: `${stats.failed} 个商品发布失败` },
    { type: 'warning', message: `${stats.pending} 个商品待处理` },
    { type: 'warning', message: `${filteredProducts.length - stats.completeness} 个商品完整度低于 80%` }
  ].filter(w => w.type === 'error' ? stats.failed > 0 : true);

  // 图表配置
  const selectionConfig = {
    data: dailyData,
    xField: 'date',
    yField: 'selections',
    height: 250,
    smooth: true,
    xAxis: {
      range: [0, 1],
      tickCount: 7,
      label: {
        formatter: (v: string) => dayjs(v).format('MM-DD'),
        style: {
          fontSize: 12,
          rotate: 0,
        },
        offset: 16
      },
      grid: {
        line: {
          style: {
            stroke: '#f0f0f0',
            lineWidth: 1,
            lineDash: [4, 4],
          },
        },
      },
    },
    yAxis: {
      tickCount: 5,
      label: {
        formatter: (v: string) => Number(v).toFixed(0)
      },
      grid: {
        line: {
          style: {
            stroke: '#f0f0f0',
            lineWidth: 1,
            lineDash: [4, 4],
          },
        },
      },
    },
    tooltip: {
      formatter: (data: any) => {
        return { 
          name: '新建选品', 
          value: data.selections,
          title: dayjs(data.date).format('MM月DD日')
        };
      }
    },
    areaStyle: () => {
      return {
        fill: 'l(270) 0:#ffffff 0.5:#e6f4ff 1:#1677ff',
      };
    },
    line: {
      color: '#1677ff',
    },
    meta: {
      selections: {
        alias: '选品数量'
      }
    }
  };

  const categoryConfig = {
    data: filteredProducts.reduce((acc, product) => {
      const index = acc.findIndex(item => item.type === product.category);
      if (index >= 0) {
        acc[index].value += 1;
      } else {
        acc.push({ type: product.category, value: 1 });
      }
      return acc;
    }, [] as { type: string; value: number }[]),
    angleField: 'value',
    colorField: 'type',
    radius: 0.7,
    height: 250,
    label: {
      type: 'spider',
      content: '{name}\n{percentage}',
    },
    legend: {
      position: 'bottom',
      itemHeight: 8,
    },
    interactions: [
      {
        type: 'element-active',
      },
    ],
  };

  // 问题商品列表
  const problemProducts = filteredProducts
    .filter(p => p.status === 'failed' || (p.completeness || 0) < 80)
    .map(p => ({
      id: p.id,
      name: p.name,
      status: p.status,
      category: p.category,
      completeness: p.completeness || 0,
      problems: [
        p.status === 'failed' && '发布失败',
        (p.completeness || 0) < 80 && '完整度低'
      ].filter(Boolean)
    }))
    .sort((a, b) => b.problems.length - a.problems.length)
    .slice(0, 5);

  const problemColumns = [
    {
      title: '商品名称',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: ProductStatus) => (
        <Badge 
          status={status === 'failed' ? 'error' : 'warning'} 
          text={status === 'failed' ? '发布失败' : '待处理'}
        />
      ),
    },
    {
      title: '完整���',
      key: 'completeness',
      render: (record: any) => (
        <Progress 
          percent={record.completeness}
          size="small"
          status={record.completeness < 80 ? 'exception' : 'active'}
        />
      ),
    },
    {
      title: '问题',
      dataIndex: 'problems',
      key: 'problems',
      render: (problems: string[]) => (
        <Space>
          {problems.map((problem, index) => (
            <Tag key={index} color={problem === '发布失败' ? 'error' : 'warning'}>
              {problem}
            </Tag>
          ))}
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center mb-6">
        <Space size="large">
          <h1 className="text-2xl font-semibold m-0">数据看板</h1>
          {warnings.length > 0 && (
            <Alert
              message={
                <Space>
                  <ExclamationCircleOutlined />
                  <span>发现 {warnings.length} 个问题需要处理</span>
                </Space>
              }
              type="warning"
              showIcon={false}
              className="mb-0"
            />
          )}
        </Space>
        <Space>
          <Select
            value={selectedStore}
            onChange={setSelectedStore}
            style={{ width: 200 }}
            options={[
              { label: '全部店铺', value: 'all' },
              ...(storeAccounts || []).map(store => ({
                label: store.name,
                value: store.id
              }))
            ]}
          />
          <RangePicker
            value={dateRange}
            onChange={(dates) => dates && setDateRange([dates[0] || dayjs(), dates[1] || dayjs()])}
            allowClear={false}
          />
        </Space>
      </div>
      
      <Row gutter={16}>
        <Col span={6}>
          <Card>
            <Statistic
              title={
                <Tooltip title="所有状态的商品总数">
                  <Space>
                    <ShoppingOutlined />
                    <span>商品总数</span>
                  </Space>
                </Tooltip>
              }
              value={stats.total}
              suffix={
                <small className="text-gray-400">
                  {stats.published > 0 && `${((stats.published / stats.total) * 100).toFixed(1)}% 已发布`}
                </small>
              }
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title={
                <Tooltip title="已接入的店铺数量">
                  <Space>
                    <ShopOutlined />
                    <span>店铺数量</span>
                  </Space>
                </Tooltip>
              }
              value={stats.storeCount}
              suffix={
                <small className="text-gray-400">
                  {stats.categoryCount} 个分类
                </small>
              }
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title={
                <Tooltip title="待处理的商品数量">
                  <Space>
                    <AlertOutlined />
                    <span>待处理</span>
                  </Space>
                </Tooltip>
              }
              value={stats.pending + stats.failed}
              suffix={
                <small className="text-gray-400">
                  {stats.failed > 0 && `${stats.failed} 个失败`}
                </small>
              }
              valueStyle={{ color: stats.failed > 0 ? '#ff4d4f' : '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title={
                <Tooltip title="选品库商品数量">
                  <Space>
                    <AppstoreOutlined />
                    <span>选品数量</span>
                  </Space>
                </Tooltip>
              }
              value={stats.selectionCount}
              suffix={
                <small className="text-gray-400">
                  {stats.completeness} 个已完善
                </small>
              }
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Card 
            title={
              <div className="flex justify-between items-center">
                <span>每日新增选品</span>
                <Select
                  value={selectedTimeRange}
                  onChange={setSelectedTimeRange}
                  style={{ width: 100 }}
                  options={[
                    { label: '近一周', value: '7d' },
                    { label: '近一月', value: '30d' },
                    { label: '近三月', value: '90d' },
                    { label: '近半年', value: '180d' },
                    { label: '近一年', value: '365d' },
                  ]}
                />
              </div>
            }
          >
            <Area {...selectionConfig} />
          </Card>
        </Col>
        <Col span={12}>
          <Card 
            title={
              <Space>
                <span>问题商品</span>
                <Tag color="error">{problemProducts.length} 个待处理</Tag>
              </Space>
            }
          >
            <Table
              columns={problemColumns}
              dataSource={problemProducts}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={24}>
          <Card title="商品分类分布">
            <Pie {...categoryConfig} />
          </Card>
        </Col>
      </Row>

    </div>
  );
};

export default Dashboard;