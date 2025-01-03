import React from 'react';
import { useNavigate } from 'react-router-dom';
import { message, Button } from 'antd';
import CreateProductForm from './CreateProductForm';
import type { CreateProductRequest } from '../../types/product';
import useSelectionStore from '../../store/selectionStore';
import type { ProductSelection, ProductSelectionStatus } from '../../types/product';

const NewProduct: React.FC = () => {
  const navigate = useNavigate();
  const { addSelection } = useSelectionStore();

  const handleSubmit = async (values: CreateProductRequest) => {
    try {
      const newSelection: Partial<ProductSelection> & { id: string } = {
        id: Date.now().toString(),
        name: values.name,
        category: values.category,
        price: values.price,
        stock: values.stock,
        status: 'pending' as ProductSelectionStatus,
        createdAt: new Date().toISOString(),
        description: values.description,
        source: 'manual',
        hasSpecs: values.hasSpecs,
        specs: values.specs,
        deliveryMethod: values.deliveryMethod,
        deliveryInfo: values.deliveryInfo,
        lastUpdated: new Date().toISOString()
      };

      addSelection(newSelection);
      message.success('创建成功');
      navigate('/products');
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