import React from 'react';
import { Routes, Route } from 'react-router-dom';
import TemplateList from './TemplateList';
import TemplateForm from './TemplateForm';

const Templates = () => {
  return (
    <Routes>
      <Route path="/" element={<TemplateList />} />
      <Route path="/new" element={<TemplateForm />} />
      <Route path="/edit/:id" element={<TemplateForm />} />
    </Routes>
  );
};

export default Templates;