import React from 'react';
import { Tabs } from 'antd';
import ProductLibrary from './ProductLibrary';
import ProductSelection from './ProductSelection';
import ProductListing from './ProductListing';

const Products: React.FC = () => {
  return (
    <Tabs
      defaultActiveKey="library"
      items={[
        {
          key: 'library',
          label: '商品库',
          children: <ProductLibrary />,
        },
        {
          key: 'selection',
          label: '选品管理',
          children: <ProductSelection />,
        },
        {
          key: 'listing',
          label: '上架管理',
          children: <ProductListing />,
        },
      ]}
    />
  );
};

export default Products;