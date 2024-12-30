import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { AppError } from '../middlewares/errorHandler';
import prisma from '../config/database';
import { handlePagination, handleSort, formatResponse } from '../utils/helpers';
import logger from '../utils/logger';

// 获取选品列表
export const getSelections = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { status, category, keyword } = req.query;
    const { skip, take, page, pageSize } = handlePagination(req.query);
    const sort = handleSort(req.query.sortBy as string, req.query.sortOrder as 'asc' | 'desc');

    // 构建查询条件
    const where: any = {};
    if (status) where.status = status;
    if (category) where.category = category;
    if (keyword) {
      where.OR = [
        { title: { contains: keyword as string, mode: 'insensitive' } },
        { description: { contains: keyword as string, mode: 'insensitive' } }
      ];
    }

    // 查询数据
    const [selections, total] = await Promise.all([
      prisma.selection.findMany({
        where,
        skip,
        take,
        orderBy: sort || { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          type: true,
          source: true,
          data: true,
          createdAt: true,
          updatedAt: true,
          user: {
            select: {
              id: true,
              username: true
            }
          }
        }
      }),
      prisma.selection.count({ where })
    ]);

    res.json(formatResponse(
      { items: selections, total, page, pageSize },
      '获取选品列表成功'
    ));
  } catch (error) {
    next(error);
  }
};

// 创建选品
export const createSelection = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { title, description, type, source, data } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError('未认证', 401);
    }

    // 确保data是JSON对象
    let jsonData;
    try {
      jsonData = typeof data === 'string' ? JSON.parse(data) : data;
    } catch (error) {
      logger.error('Invalid data format:', error);
      throw new AppError('数据格式无效', 400);
    }

    logger.info('Creating selection with data:', {
      title,
      description,
      type,
      source,
      data: jsonData,
      userId
    });

    const selection = await prisma.selection.create({
      data: {
        title,
        description,
        type,
        source,
        data: jsonData,
        status: 'draft',
        createdBy: userId
      },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        type: true,
        source: true,
        data: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            username: true
          }
        }
      }
    }).catch((error: unknown) => {
      logger.error('Database error:', error);
      if (error instanceof Error) {
        throw new AppError('数据库操作失败: ' + error.message, 500);
      }
      throw new AppError('数据库操作失败', 500);
    });

    logger.info(`Selection created: ${selection.id} by user ${userId}`);

    res.status(201).json(formatResponse(
      selection,
      '创建选品成功'
    ));
  } catch (error: unknown) {
    logger.error('Error in createSelection:', error);
    if (error instanceof AppError) {
      next(error);
    } else if (error instanceof Error) {
      next(new AppError('服务器内部错误: ' + error.message, 500));
    } else {
      next(new AppError('服务器内部错误', 500));
    }
  }
};

// 更新选品
export const updateSelection = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { title, description, status, data } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError('未认证', 401);
    }

    // 检查选品是否存在
    const existingSelection = await prisma.selection.findUnique({
      where: { id: Number(id) }
    });

    if (!existingSelection) {
      throw new AppError('选品不存在', 404);
    }

    // 检查权限
    if (existingSelection.createdBy !== userId) {
      throw new AppError('无权限修改此选品', 403);
    }

    // 更新选品
    const selection = await prisma.selection.update({
      where: { id: Number(id) },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(status && { status }),
        ...(data && { data }),
        updatedAt: new Date()
      },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        type: true,
        source: true,
        data: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            username: true
          }
        }
      }
    });

    logger.info(`Selection updated: ${id} by user ${userId}`);

    res.json(formatResponse(
      selection,
      '更新选品成功'
    ));
  } catch (error: unknown) {
    logger.error('Error in updateSelection:', error);
    if (error instanceof AppError) {
      next(error);
    } else if (error instanceof Error) {
      next(new AppError('服务器内部错误: ' + error.message, 500));
    } else {
      next(new AppError('服务器内部错误', 500));
    }
  }
};

// 删除选品
export const deleteSelection = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError('未认证', 401);
    }

    // 检查选品是否存在
    const existingSelection = await prisma.selection.findUnique({
      where: { id: Number(id) }
    });

    if (!existingSelection) {
      throw new AppError('选品不存在', 404);
    }

    // 检查权限
    if (existingSelection.createdBy !== userId) {
      throw new AppError('无权限删除此选品', 403);
    }

    // 删除选品
    await prisma.selection.delete({
      where: { id: Number(id) }
    });

    logger.info(`Selection deleted: ${id} by user ${userId}`);

    res.json(formatResponse(
      null,
      '删除选品成功'
    ));
  } catch (error: unknown) {
    logger.error('Error in deleteSelection:', error);
    if (error instanceof AppError) {
      next(error);
    } else if (error instanceof Error) {
      next(new AppError('服务器内部错误: ' + error.message, 500));
    } else {
      next(new AppError('服务器内部错误', 500));
    }
  }
}; 