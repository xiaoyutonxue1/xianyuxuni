import React from 'react';
import './styles/upload.css';
import { RouterProvider } from 'react-router-dom';
import router from './router';

const App: React.FC = () => {
  return <RouterProvider router={router} />;
};

export default App;