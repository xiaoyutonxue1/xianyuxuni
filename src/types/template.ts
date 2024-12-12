export interface Template {
  id: number;
  name: string;
  content: string;
  type: 'default' | 'custom';
  storeId: string;
  createdAt: string;
  updatedAt: string;
  variables: TemplateVariable[];
}

export interface TemplateVariable {
  key: string;
  name: string;
  type: 'text' | 'number' | 'image' | 'list';
  required: boolean;
  defaultValue?: string;
}

export interface TemplateFormValues {
  name: string;
  content: string;
  type: 'default' | 'custom';
  storeId: string;
  variables: TemplateVariable[];
}

export interface TemplatePreviewData {
  [key: string]: string | number | string[];
} 