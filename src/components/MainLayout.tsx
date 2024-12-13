import React, { useState } from 'react';
import { Layout, Menu, Button } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  PlusOutlined,
  SwapOutlined,
  AppstoreOutlined,
  SettingOutlined,
  DashboardOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';

const { Header, Content, Sider } = Layout;

const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: '数据看板',
      onClick: () => navigate('/dashboard'),
    },
    {
      key: 'new-product',
      icon: <PlusOutlined />,
      label: '新建选品',
      onClick: () => navigate('/new-product'),
    },
    {
      key: 'allocation',
      icon: <SwapOutlined />,
      label: '选品分配',
      onClick: () => navigate('/allocation'),
    },
    {
      key: 'management',
      icon: <AppstoreOutlined />,
      label: '商品管理',
      onClick: () => navigate('/management'),
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header 
        style={{ 
          background: '#fff', 
          padding: '0 24px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          position: 'fixed',
          width: '100%',
          top: 0,
          zIndex: 1000,
          boxShadow: '0 2px 8px #f0f1f2',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: '16px', marginRight: 16 }}
          />
          <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>虚拟商品管理系统</h1>
        </div>
        <Button 
          type="text" 
          icon={<SettingOutlined />}
          onClick={() => navigate('/settings')}
        >
          设置
        </Button>
      </Header>
      <Layout style={{ marginTop: 64 }}>
        <Sider
          trigger={null}
          collapsible
          collapsed={collapsed}
          style={{
            overflow: 'auto',
            height: 'calc(100vh - 64px)',
            position: 'fixed',
            left: 0,
            top: 64,
            bottom: 0,
          }}
        >
          <Menu
            mode="inline"
            selectedKeys={[location.pathname.slice(1) || 'dashboard']}
            items={menuItems}
            style={{ height: '100%', borderRight: 0 }}
          />
        </Sider>
        <Layout style={{ marginLeft: collapsed ? 80 : 200, transition: 'all 0.2s' }}>
          <Content style={{ 
            padding: 24,
            minHeight: 'calc(100vh - 64px)',
            background: '#fff',
          }}>
            <Outlet />
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
};

export default MainLayout; 