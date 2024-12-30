import { Request } from 'express';
import { User } from '@prisma/client';

// 扩展Request类型，添加用户信息
export interface AuthRequest extends Request {
  user?: User;
  file?: Express.Multer.File;
  files?: Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] };
}

// 分页参数接口
export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// 日期范围参数接口
export interface DateRangeParams {
  startDate?: string;
  endDate?: string;
}

// 搜索参数接口
export interface SearchParams {
  keyword?: string;
  status?: string;
  type?: string;
}

// 响应数据接口
export interface ResponseData<T = any> {
  message: string;
  data?: T;
  error?: string;
  meta?: {
    total?: number;
    page?: number;
    pageSize?: number;
    statusCode?: number;
  };
} 