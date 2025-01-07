import { mockDataService } from '../utils/mockData';

export interface ProductQueryParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  category?: string;
  store?: string;
  status?: string;
  method?: 'crawler' | 'manual';
  sortField?: string;
  sortOrder?: 'ascend' | 'descend';
}

export const getProducts = (params: ProductQueryParams) => {
  return mockDataService.getProducts(params);
};

export const getProduct = (id: number) => {
  return mockDataService.getProduct(id);
};

export const createProduct = (product: any) => {
  return mockDataService.createProduct(product);
};

export const updateProduct = (id: number, product: any) => {
  return mockDataService.updateProduct(id, product);
};

export const deleteProduct = (id: number) => {
  return mockDataService.deleteProduct(id);
};

export const batchDeleteProducts = (ids: number[]) => {
  return mockDataService.batchDeleteProducts(ids);
};

export const batchEditProducts = (payload: any) => {
  return mockDataService.batchEditProducts(payload);
};

export const distributeProducts = (payload: { productIds: number[], accountIds: string[] }) => {
  return mockDataService.distributeProducts(payload);
}; 