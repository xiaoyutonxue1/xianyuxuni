import React, { useState } from 'react';
import { Layout, Menu, Button, Avatar, Dropdown, Modal } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import type { MenuProps } from 'antd';
import {
  PlusOutlined,
  SwapOutlined,
  AppstoreOutlined,
  SettingOutlined,
  DashboardOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '@/store/auth';

const { Header, Content, Sider } = Layout;

const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    Modal.confirm({
      title: '确认退出',
      content: '您确定要退出登录吗？',
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        await logout();
        navigate('/login');
      },
    });
  };

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

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: (
        <div style={{ minWidth: '120px' }}>
          <div>{user?.username}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>角色：{user?.role}</div>
        </div>
      ),
    },
    {
      type: 'divider',
    },
    {
      key: 'admin-settings',
      icon: <UserOutlined />,
      label: '个人设置',
      onClick: () => navigate('/admin-settings'),
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '系统设置',
      onClick: () => navigate('/settings'),
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
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
        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
          <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <Avatar 
              style={{ 
                backgroundColor: '#1677ff',
                marginRight: 8 
              }} 
              icon={<UserOutlined />}
            />
            <span>{user?.username}</span>
          </div>
        </Dropdown>
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