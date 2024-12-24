import { createBrowserRouter } from 'react-router-dom';
import Login from '@/pages/Login';
import MainLayout from '@/components/MainLayout';
import AuthRoute from '@/components/AuthRoute';
import Dashboard from '../pages/Dashboard';
import ProductLibrary from '../pages/Products/ProductLibrary';
import ProductAllocation from '../pages/Products/ProductAllocation';
import ProductManagement from '../pages/Products/ProductManagement';
import Settings from '../pages/Settings';

const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
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
    ],
  },
]);

export default router; 