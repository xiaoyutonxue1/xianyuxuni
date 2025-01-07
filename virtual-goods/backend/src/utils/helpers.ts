import { Response } from 'express';
import { PaginationParams, ResponseData } from '../types';

// 格式化响应数据
export const formatResponse = <T>(
  data: T,
  message = '操作成功',
  meta?: ResponseData['meta']
): ResponseData<T> => ({
  message,
  data,
  ...(meta && { meta })
});

// 格式化错误响应
export const formatError = (
  error: Error,
  statusCode: number
): ResponseData => ({
  message: error.message || '服务器内部错误',
  error: error.name,
  meta: { statusCode }
});

// 处理分页参数
export const handlePagination = (params: PaginationParams) => {
  const page = Number(params.page) || 1;
  const pageSize = Number(params.pageSize) || 10;
  const skip = (page - 1) * pageSize;
  const take = pageSize;

  return {
    skip,
    take,
    page,
    pageSize
  };
};

// 处理排序参数
export const handleSort = (sortBy?: string, sortOrder?: 'asc' | 'desc') => {
  if (!sortBy) return undefined;

  return {
    [sortBy]: sortOrder || 'desc'
  };
};

// 发送JSON响应
export const sendResponse = <T>(
  res: Response,
  statusCode: number,
  data: ResponseData<T>
) => {
  return res.status(statusCode).json(data);
};

// 生成随机字符串
export const generateRandomString = (length: number): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// 检查字符串是否是有效的JSON
export const isValidJSON = (str: string): boolean => {
  try {
    JSON.parse(str);
    return true;
  } catch (e) {
    return false;
  }
};

// 安全的JSON解析
export const safeJSONParse = <T>(str: string, fallback: T): T => {
  try {
    return JSON.parse(str);
  } catch (e) {
    return fallback;
  }
};

// 延迟函数
export const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// 重试函数
export const retry = async <T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 1000
): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) throw error;
    await new Promise(resolve => setTimeout(resolve, delay));
    return retry(fn, retries - 1, delay);
  }
};

// 移除对象中的空值
export const removeEmpty = <T extends object>(obj: T): Partial<T> => {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, v]) => v != null)
  ) as Partial<T>;
};

// 格式化日期范围
export const formatDateRange = (startDate?: string, endDate?: string) => {
  if (!startDate && !endDate) return undefined;

  const range: { gte?: Date; lte?: Date } = {};
  if (startDate) range.gte = new Date(startDate);
  if (endDate) range.lte = new Date(endDate);

  return range;
}; 