import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import logger from '../utils/logger';
import { formatError } from '../utils/helpers';

// 自定义错误类
export class AppError extends Error {
  statusCode: number;
  status: string;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Prisma错误处理
const handlePrismaError = (error: PrismaClientKnownRequestError) => {
  logger.error('Prisma Error:', {
    code: error.code,
    meta: error.meta,
    message: error.message,
    target: error.meta?.target
  });
  
  switch (error.code) {
    case 'P2002':
      return new AppError(`数据已存在，请检查唯一性约束: ${error.meta?.target}`, 400);
    case 'P2014':
      return new AppError(`数据关联错误，请检查外键约束: ${error.meta?.target}`, 400);
    case 'P2003':
      return new AppError(`数据关联错误，请检查外键约束: ${error.meta?.target}`, 400);
    case 'P2025':
      return new AppError(`数据不存在: ${error.meta?.target}`, 404);
    case 'P2000':
      return new AppError(`数据验证失败: ${error.meta?.target}`, 400);
    case 'P2001':
      return new AppError(`数据记录不存在: ${error.meta?.target}`, 404);
    case 'P2005':
      return new AppError(`数据库字段值不合法: ${error.meta?.target}`, 400);
    case 'P2006':
      return new AppError(`数据库值不合法: ${error.meta?.target}`, 400);
    case 'P2007':
      return new AppError(`数据验证失败: ${error.meta?.target}`, 400);
    case 'P2008':
      return new AppError(`数据库查询失败: ${error.message}`, 500);
    case 'P2009':
      return new AppError(`数据库查询失败，请检查查询语法: ${error.message}`, 500);
    case 'P2010':
      return new AppError(`数据库查询超时: ${error.message}`, 500);
    case 'P2011':
      return new AppError(`数据为空: ${error.meta?.target}`, 400);
    case 'P2012':
      return new AppError(`缺少必填字段: ${error.meta?.target}`, 400);
    case 'P2013':
      return new AppError(`数据类型不匹配: ${error.meta?.target}`, 400);
    case 'P2015':
      return new AppError(`相关记录不存在: ${error.meta?.target}`, 404);
    case 'P2016':
      return new AppError(`查询解析错误: ${error.message}`, 500);
    case 'P2017':
      return new AppError(`数据关系错误: ${error.meta?.target}`, 400);
    case 'P2018':
      return new AppError(`连接失败: ${error.message}`, 500);
    case 'P2019':
      return new AppError(`输入错误: ${error.meta?.target}`, 400);
    case 'P2020':
      return new AppError(`值超出范围: ${error.meta?.target}`, 400);
    case 'P2021':
      return new AppError(`表不存在: ${error.meta?.target}`, 500);
    case 'P2022':
      return new AppError(`列不存在: ${error.meta?.target}`, 500);
    case 'P2023':
      return new AppError(`数据不一致: ${error.meta?.target}`, 500);
    case 'P2024':
      return new AppError(`连接超时: ${error.message}`, 500);
    case 'P2026':
      return new AppError(`数据库请求失败: ${error.message}`, 500);
    case 'P2027':
      return new AppError(`多条记录错误: ${error.meta?.target}`, 500);
    case 'P2028':
      return new AppError(`事务错误: ${error.message}`, 500);
    case 'P2030':
      return new AppError(`全文搜索错误: ${error.message}`, 500);
    case 'P2033':
      return new AppError(`数字解析错误: ${error.meta?.target}`, 400);
    case 'P2034':
      return new AppError(`记录已存在: ${error.meta?.target}`, 400);
    default:
      return new AppError(`数据库操作错误: ${error.message}`, 500);
  }
};

// JWT错误处理
const handleJWTError = () => new AppError('无效的Token', 401);
const handleJWTExpiredError = () => new AppError('Token已过期', 401);

// 错误处理中间件
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) => {
  // 默认错误状态
  let error = err;
  
  // 记录原始错误信息
  logger.error('Original Error:', {
    name: err.name,
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body,
    query: req.query,
    params: req.params
  });
  
  // 处理Prisma错误
  if (err instanceof PrismaClientKnownRequestError) {
    error = handlePrismaError(err);
    logger.error('Prisma Error Details:', {
      code: err.code,
      meta: err.meta,
      clientVersion: err.clientVersion,
      target: err.meta?.target
    });
  }
  
  // 处理JWT错误
  if (err.name === 'JsonWebTokenError') error = handleJWTError();
  if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();

  // 处理已知的操作错误
  if (error instanceof AppError) {
    logger.warn(`[${error.statusCode}] ${error.message}`, {
      path: req.path,
      method: req.method
    });
    return res.status(error.statusCode).json(formatError(error, error.statusCode));
  }

  // 处理未知错误
  logger.error('Unhandled Error:', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method
  });
  return res.status(500).json(formatError(
    new Error('服务器内部错误'),
    500
  ));
};