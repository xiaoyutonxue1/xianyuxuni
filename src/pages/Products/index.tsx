import React from 'react';
import { Tabs } from 'antd';
import type { TabsProps } from 'antd';
import ProductSelection from './ProductSelection';
import ProductListing from './ProductListing';

const Products: React.FC = () => {
  const items: TabsProps['items'] = [
    {
      key: 'selection',
      label: '选品管理',
      children: <ProductSelection />,
    },
    {
      key: 'listing',
      label: '上品管理',
      children: <ProductListing />,
    },
  ];

  return (
    <div className="bg-white p-6 rounded-lg">
      <Tabs defaultActiveKey="selection" items={items} />
    </div>
  );
};

export default Products;