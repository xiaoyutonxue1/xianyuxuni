import React from 'react';
import { Layout, Menu, Button, Dropdown } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  ShoppingOutlined,
  FileTextOutlined,
  SettingOutlined,
  DashboardOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';

const { Header, Content } = Layout;

const AppLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: '数据看板',
    },
    {
      key: '/products',
      icon: <ShoppingOutlined />,
      label: '商品管理',
    },
    {
      key: '/templates',
      icon: <FileTextOutlined />,
      label: '模板管理',
    },
  ];

  const settingsMenuItems: MenuProps['items'] = [
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '系统设置',
      onClick: () => navigate('/settings'),
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <h1 style={{ margin: '0 24px 0 0', fontSize: '18px', fontWeight: 'bold' }}>虚拟商品管理系统</h1>
          <Menu
            mode="horizontal"
            selectedKeys={[location.pathname]}
            items={menuItems}
            onClick={({ key }) => navigate(key)}
            style={{ flex: 1, minWidth: 400 }}
          />
        </div>
        <Dropdown menu={{ items: settingsMenuItems }} placement="bottomRight">
          <Button type="text" icon={<SettingOutlined />}>
            设置
          </Button>
        </Dropdown>
      </Header>
      <Content style={{ padding: '24px' }}>
        <div style={{ background: '#fff', padding: 24, minHeight: 'calc(100vh - 112px)' }}>
          <Outlet />
        </div>
      </Content>
    </Layout>
  );
};

export default AppLayout; 