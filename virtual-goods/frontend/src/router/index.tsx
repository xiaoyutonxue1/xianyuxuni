import { createBrowserRouter } from 'react-router-dom';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import MainLayout from '@/components/MainLayout';
import AuthRoute from '@/components/AuthRoute';
import Dashboard from '../pages/Dashboard';
import ProductLibrary from '../pages/Products/ProductLibrary';
import ProductAllocation from '../pages/Products/ProductAllocation';
import ProductManagement from '../pages/Products/ProductManagement';
import Settings from '../pages/Settings';
import AdminSettings from '../pages/AdminSettings';

const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/register',
    element: <Register />,
  },
  {
    path: '/',
    element: (
      <AuthRoute>
        <MainLayout />
      </AuthRoute>
    ),
    children: [
      {
        path: '/',
        element: <Dashboard />,
      },
      {
        path: 'dashboard',
        element: <Dashboard />,
      },
      {
        path: 'new-product',
        element: <ProductLibrary />,
      },
      {
        path: 'allocation',
        element: <ProductAllocation />,
      },
      {
        path: 'management',
        element: <ProductManagement />,
      },
      {
        path: 'settings',
        element: <Settings />,
      },
      {
        path: 'admin-settings',
        element: <AdminSettings />,
      },
    ],
  },
]);

export default router; 