import React from 'react';
import { Layout, Menu } from 'antd';
import { Link, useLocation } from 'react-router-dom';
import {
  BarChartOutlined,
  ShoppingOutlined,
  FileTextOutlined,
  CarOutlined,
} from '@ant-design/icons';

const { Sider } = Layout;

const Sidebar = () => {
  const location = useLocation();

  const items = [
    {
      key: '/',
      icon: <BarChartOutlined />,
      label: <Link to="/">数据看板</Link>,
    },
    {
      key: '/products',
      icon: <ShoppingOutlined />,
      label: <Link to="/products">商品管理</Link>,
    },
    {
      key: '/templates',
      icon: <FileTextOutlined />,
      label: <Link to="/templates">模板管理</Link>,
    },
    {
      key: '/shipping',
      icon: <CarOutlined />,
      label: <Link to="/shipping">发货设置</Link>,
    },
  ];

  return (
    <Sider theme="light" width={200} className="border-r">
      <div className="h-16 flex items-center justify-center border-b">
        <h1 className="text-lg font-semibold">虚拟商品管理系统</h1>
      </div>
      <Menu
        mode="inline"
        selectedKeys={[location.pathname]}
        items={items}
        className="h-[calc(100vh-64px)]"
      />
    </Sider>
  );
}

export default Sidebar;