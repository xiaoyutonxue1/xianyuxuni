import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../types';
import { AppError } from './errorHandler';
import prisma from '../config/database';
import logger from '../utils/logger';

// JWT认证中间件
export const auth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // 获取token
    const authHeader = req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AppError('未提供认证Token', 401);
    }

    const token = authHeader.replace('Bearer ', '');

    // 验证token
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      id: number;
      username: string;
      role: string;
    };

    // 检查用户是否存在
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        username: true,
        role: true,
        status: true
      }
    });

    if (!user || user.status !== 'active') {
      throw new AppError('用户不存在或已禁用', 401);
    }

    // 将用户信息添加到请求对象
    req.user = {
      id: user.id,
      username: user.username,
      role: user.role
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError('无效的Token', 401));
    } else {
      next(error);
    }
  }
};

// 角色验证中间件
export const checkRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('未认证', 401);
      }

      if (!roles.includes(req.user.role)) {
        throw new AppError('无权限访问', 403);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// 资源所有者验证中间件
export const checkOwnership = (resourceType: 'selection' | 'product' | 'store' | 'template') => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('未认证', 401);
      }

      const resourceId = Number(req.params.id);
      if (!resourceId) {
        throw new AppError('无效的资源ID', 400);
      }

      // 管理员可以访问所有资源
      if (req.user.role === 'admin') {
        return next();
      }

      // 检查资源所有权
      const resource = await (prisma[resourceType] as any).findUnique({
        where: { id: resourceId },
        select: { createdBy: true }
      });

      if (!resource) {
        throw new AppError('资源不存在', 404);
      }

      if (resource.createdBy !== req.user.id) {
        throw new AppError('无权限访问此资源', 403);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// 日志记录中间件
export const logAccess = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (req.user) {
      const logData = {
        userId: req.user.id,
        action: `${req.method} ${req.path}`,
        targetType: req.path.split('/')[1],
        details: {
          method: req.method,
          path: req.path,
          query: req.query,
          params: req.params,
          body: req.method !== 'GET' ? req.body : undefined
        }
      };

      // 异步记录日志，不阻塞请求
      prisma.operationLog.create({ data: logData }).catch(error => {
        logger.error('Failed to create access log:', error);
      });
    }

    next();
  } catch (error) {
    next(error);
  }
}; 