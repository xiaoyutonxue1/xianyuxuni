import React from 'react';
import { useNavigate } from 'react-router-dom';
import { message, Button } from 'antd';
import CreateProductForm from './CreateProductForm';
import type { CreateProductRequest } from '../../types/product';
import useSelectionStore from '../../store/selectionStore';

const NewProduct: React.FC = () => {
  const navigate = useNavigate();
  const { addSelection } = useSelectionStore();

  const handleSubmit = async (values: CreateProductRequest) => {
    try {
      // 创建新的选品记录
      const newSelection = {
        id: Date.now().toString(),
        name: values.name,
        category: values.category,
        price: values.price,
        stock: values.stock,
        status: 'pending',
        createdAt: new Date().toISOString(),
        description: values.description,
        source: values.method,
        hasSpecs: values.hasSpecs,
        saleInfo: values.hasSpecs ? undefined : {
          price: values.price,
          stock: values.stock,
          deliveryMethod: values.deliveryMethod,
          deliveryInfo: values.deliveryInfo,
          originalPrice: values.price
        },
        specs: values.hasSpecs ? values.specs : undefined,
        lastUpdated: new Date().toISOString()
      };

      // 添加到选品库
      addSelection(newSelection);
      message.success('选品创建成功');
      navigate('/selection');
    } catch (error) {
      message.error('创建失败');
    }
  };

  const handleCancel = () => {
    navigate('/selection');
  };

  return (
    <div className="p-4">
      <CreateProductForm 
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </div>
  );
};

export default NewProduct; 