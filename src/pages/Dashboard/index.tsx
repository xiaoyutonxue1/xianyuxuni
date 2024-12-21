import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Space, Table, Progress, DatePicker, Alert, Badge, Tooltip, Tag } from 'antd';
import { Line, Column, Pie } from '@ant-design/plots';
import { 
  ShoppingOutlined, 
  ShoppingCartOutlined, 
  DollarOutlined,
  AlertOutlined,
  RiseOutlined,
  FallOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import useProductStore from '../../store/productStore';
import useSettingsStore from '../../store/settingsStore';
import type { Product, ProductStatus, ProductCategory } from '../../types/product';

const { RangePicker } = DatePicker;

const Dashboard: React.FC = () => {
  const products = useProductStore((state) => state.products);
  const addProducts = useProductStore((state) => state.addProducts);
  const { productSettings } = useSettingsStore();
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(30, 'days'),
    dayjs()
  ]);

  // 初始化测试数据
  useEffect(() => {
    if (products.length === 0 && addProducts) {
      const categories: ProductCategory[] = ['study', 'japanese_drama', 'american_drama', 'manga', 'korean_drama', 'chinese_drama', 'anime', 'ebook', 'movie'];
      const testProducts = Array.from({ length: 50 }, (_, index) => ({
        id: `test-${index}`,
        name: `测试商品 ${index + 1}`,
        description: `这是测试商品 ${index + 1} 的描述`,
        category: categories[Math.floor(Math.random() * categories.length)],
        price: Math.floor(Math.random() * 1000) + 100,
        stock: Math.floor(Math.random() * 100),
        status: ['published', 'pending', 'draft', 'failed'][Math.floor(Math.random() * 4)] as ProductStatus,
        createdAt: dayjs().subtract(Math.floor(Math.random() * 30), 'days').format('YYYY-MM-DD HH:mm:ss'),
        source: 'manual' as const,
        hasSpecs: Math.random() > 0.5,
        selectionId: `selection-${index}`,
        storeId: `store-${index % 3 + 1}`,
        templateId: `template-${index % 2 + 1}`,
        distributedTitle: `分发后的商品标题 ${index + 1}`,
        distributedContent: `分发后的商品内容 ${index + 1}`,
        distributedAt: dayjs().subtract(Math.floor(Math.random() * 30), 'days').format('YYYY-MM-DD HH:mm:ss'),
        lastUpdated: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        completeness: Math.floor(Math.random() * 40) + 60
      }));
      addProducts(testProducts);
    }
  }, [products.length, addProducts]);

  // 计算核心指标
  const stats = {
    total: products.length,
    published: products.filter(p => p.status === 'published').length,
    pending: products.filter(p => p.status === 'pending').length,
    failed: products.filter(p => p.status === 'failed').length,
    lowStock: products.filter(p => p.stock < 10).length,
    lowCompleteness: products.filter(p => (p.completeness || 0) < 80).length,
    totalValue: products.reduce((sum, p) => sum + p.price * p.stock, 0),
    avgPrice: products.length ? products.reduce((sum, p) => sum + p.price, 0) / products.length : 0
  };

  // 生成每日数据
  const getDailyData = () => {
    const days = 30;
    return Array.from({ length: days }, (_, i) => {
      const date = dayjs().subtract(days - 1 - i, 'days').format('YYYY-MM-DD');
      return {
        date,
        published: Math.floor(Math.random() * 10),
        revenue: Math.floor(Math.random() * 10000),
        orders: Math.floor(Math.random() * 50)
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
    { type: 'warning', message: `${stats.lowStock} 个商品库存不足 10 件` },
    { type: 'warning', message: `${stats.lowCompleteness} 个商品完整度低于 80%` }
  ].filter(w => w.type === 'error' ? stats.failed > 0 : true);

  // 图表配置
  const revenueConfig = {
    data: dailyData,
    xField: 'date',
    yField: 'revenue',
    seriesField: 'type',
    height: 300,
    xAxis: {
      type: 'time',
      tickCount: 5,
    },
    yAxis: {
      label: {
        formatter: (v: string) => `¥${Number(v).toLocaleString()}`
      }
    },
    tooltip: {
      formatter: (data: any) => {
        return { name: '收入', value: `¥${data.revenue.toLocaleString()}` };
      }
    }
  };

  const publishConfig = {
    data: dailyData,
    xField: 'date',
    yField: 'published',
    columnWidthRatio: 0.4,
    height: 300,
    label: {
      position: 'top',
    },
    xAxis: {
      label: {
        formatter: (v: string) => dayjs(v).format('MM-DD')
      }
    },
    tooltip: {
      formatter: (data: any) => {
        return { name: '发布数量', value: data.published };
      }
    }
  };

  const categoryConfig = {
    data: products.reduce((acc, product) => {
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
    radius: 0.8,
    label: {
      type: 'spider',
      content: '{name}\n{percentage}',
    },
    legend: {
      position: 'bottom',
    },
  };

  // 问题商品列表
  const problemProducts = products
    .filter(p => p.status === 'failed' || p.stock < 10 || (p.completeness || 0) < 80)
    .map(p => ({
      id: p.id,
      name: p.name,
      status: p.status,
      stock: p.stock,
      completeness: p.completeness || 0,
      problems: [
        p.status === 'failed' && '发布失败',
        p.stock < 10 && '库存不足',
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
      title: '库存',
      dataIndex: 'stock',
      key: 'stock',
      render: (stock: number) => (
        <span className={stock < 10 ? 'text-red-500' : ''}>
          {stock}
        </span>
      ),
    },
    {
      title: '完整度',
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
        <RangePicker
          value={dateRange}
          onChange={(dates) => dates && setDateRange([dates[0] || dayjs(), dates[1] || dayjs()])}
          allowClear={false}
        />
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
                <Tooltip title="商品库存总价值">
                  <Space>
                    <DollarOutlined />
                    <span>库存价值</span>
                  </Space>
                </Tooltip>
              }
              value={stats.totalValue}
              precision={2}
              prefix="¥"
              suffix={
                <small className="text-gray-400">
                  均价 ¥{stats.avgPrice.toFixed(0)}
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
                <Tooltip title="库存不足或完整度低的商品数量">
                  <Space>
                    <ExclamationCircleOutlined />
                    <span>异常商品</span>
                  </Space>
                </Tooltip>
              }
              value={stats.lowStock + stats.lowCompleteness}
              suffix={
                <small className="text-gray-400">
                  {stats.lowStock > 0 && `${stats.lowStock} 个库存不足`}
                </small>
              }
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={16}>
          <Card 
            title={
              <Space>
                <span>每日收入趋势</span>
                {dailyData.length >= 2 && (
                  <span className={`text-sm ${Number(getGrowthRate(
                    dailyData[dailyData.length - 1].revenue,
                    dailyData[dailyData.length - 2].revenue
                  )) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {Number(getGrowthRate(
                      dailyData[dailyData.length - 1].revenue,
                      dailyData[dailyData.length - 2].revenue
                    )) >= 0 ? <RiseOutlined /> : <FallOutlined />}
                    {Math.abs(Number(getGrowthRate(
                      dailyData[dailyData.length - 1].revenue,
                      dailyData[dailyData.length - 2].revenue
                    )))}%
                  </span>
                )}
              </Space>
            }
          >
            <Line {...revenueConfig} />
          </Card>
        </Col>
        <Col span={8}>
          <Card title="商品分类分布">
            <Pie {...categoryConfig} />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Card title="每日发布数量">
            <Column {...publishConfig} />
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
    </div>
  );
};

export default Dashboard; 