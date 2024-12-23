import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ShippingList from './ShippingList';
import ShippingForm from './ShippingForm';

const Shipping = () => {
  return (
    <Routes>
      <Route path="/" element={<ShippingList />} />
      <Route path="/new" element={<ShippingForm />} />
      <Route path="/edit/:id" element={<ShippingForm />} />
    </Routes>
  );
};

export default Shipping;