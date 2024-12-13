import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { message } from 'antd';
import { useStore } from '../../store';
import ProductForm from './ProductForm';
import type { CreateProductRequest } from '../../types/product';

const ProductFormContainer: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  
  const { products, addProduct, updateProduct } = useStore();
  const product = id ? products.find(p => p.id === id) : undefined;

  const handleSubmit = async (values: CreateProductRequest) => {
    try {
      setLoading(true);
      
      if (id) {
        await updateProduct(id, values);
      } else {
        await addProduct({
          ...values,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: 'draft',
        });
      }
      
      message.success(id ? '商品更新成功' : '商品创建成功');
      navigate('/products');
    } catch (error) {
      message.error('操作失败: ' + (error instanceof Error ? error.message : '未知错误'));
      throw error; // 向上传递错误,让表单组件处理
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProductForm
      initialData={product}
      onSubmit={handleSubmit}
      loading={loading}
    />
  );
};

export default ProductFormContainer; 