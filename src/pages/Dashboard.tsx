import React from 'react';
import { Card, Row, Col, Statistic } from 'antd';
import { Area } from '@ant-design/plots';
import { useStore } from '../store';

const Dashboard = () => {
  const products = useStore((state) => state.products);

  const data = [
    { date: '2024-01', sales: 3 },
    { date: '2024-02', sales: 4 },
    { date: '2024-03', sales: 6 },
    { date: '2024-04', sales: 8 },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">数据看板</h1>
      
      <Row gutter={16}>
        <Col span={6}>
          <Card>
            <Statistic
              title="商品总数"
              value={products.length}
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="在售商品"
              value={products.filter(p => p.status === 'selling').length}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="待审核"
              value={products.filter(p => p.status === 'pending').length}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="草稿"
              value={products.filter(p => p.status === 'draft').length}
              valueStyle={{ color: '#8c8c8c' }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="销售趋势">
        <Area
          data={data}
          xField="date"
          yField="sales"
          smooth
          areaStyle={{ fill: 'l(270) 0:#ffffff 1:#1677ff' }}
        />
      </Card>
    </div>
  );
};

export default Dashboard;