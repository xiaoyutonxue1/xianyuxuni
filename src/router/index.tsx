import { createBrowserRouter } from 'react-router-dom';
import MainLayout from '../components/MainLayout';
import Dashboard from '../pages/Dashboard';
import ProductLibrary from '../pages/Products/ProductLibrary';
import ProductSelection from '../pages/Products/ProductSelection';
import ProductAllocation from '../pages/Products/ProductAllocation';
import Settings from '../pages/Settings';

const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
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
        element: <ProductSelection />,
      },
      {
        path: 'management',
        element: <ProductAllocation />,
      },
      {
        path: 'settings',
        element: <Settings />,
      },
    ],
  },
]);

export default router; 