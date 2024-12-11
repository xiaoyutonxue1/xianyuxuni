import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ConfigProvider, Layout } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Templates from './pages/Templates';
import Shipping from './pages/Shipping';

const { Content } = Layout;

function App() {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#1677ff',
        },
      }}
    >
      <BrowserRouter>
        <Layout className="min-h-screen">
          <Sidebar />
          <Layout>
            <Content className="p-6">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/products/*" element={<Products />} />
                <Route path="/templates" element={<Templates />} />
                <Route path="/shipping" element={<Shipping />} />
              </Routes>
            </Content>
          </Layout>
        </Layout>
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default App;