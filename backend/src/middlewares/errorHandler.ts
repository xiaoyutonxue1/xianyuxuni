import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
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
const handlePrismaError = (error: Prisma.PrismaClientKnownRequestError) => {
  switch (error.code) {
    case 'P2002':
      return new AppError('数据已存在，请检查唯一性约束', 400);
    case 'P2014':
      return new AppError('数据关联错误，请检查外键约束', 400);
    case 'P2003':
      return new AppError('数据关联错误，请检查外键约束', 400);
    case 'P2025':
      return new AppError('数据不存在', 404);
    default:
      return new AppError('数据库操作错误', 500);
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
  
  // 处理Prisma错误
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    error = handlePrismaError(err);
  }
  
  // 处理JWT错误
  if (err.name === 'JsonWebTokenError') error = handleJWTError();
  if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();

  // 处理已知的操作错误
  if (error instanceof AppError) {
    logger.warn(`[${error.statusCode}] ${error.message}`);
    return res.status(error.statusCode).json(formatError(error, error.statusCode));
  }

  // 处理未知错误
  logger.error('Unhandled Error:', error);
  return res.status(500).json(formatError(
    new Error('服务器内部错误'),
    500
  ));
}; 