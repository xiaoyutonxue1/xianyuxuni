import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { AppError } from '../middlewares/errorHandler';
import prisma from '../config/database';
import { handlePagination, handleSort, formatResponse } from '../utils/helpers';
import { handleError } from '../utils/errorHandler';
import logger from '../utils/logger';
import { Prisma } from '@prisma/client';

// 获取选品列表
export const getSelections = async (req: AuthRequest, res: Response) => {
  try {
    const selections = await prisma.selection.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        category: true,
        price: true,
        stock: true,
        source: true,
        sourceUrl: true,
        coverImage: true,
        hasSpecs: true,
        createdBy: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    res.json(selections);
  } catch (error) {
    handleError(error, res);
  }
};

// 创建选品
export const createSelection = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      throw new AppError('未认证', 401);
    }

    const data: Prisma.SelectionCreateInput = {
      name: req.body.name,
      description: req.body.description || null,
      status: req.body.status || 'draft',
      category: req.body.category || null,
      price: req.body.price ? parseFloat(req.body.price) : 0,
      stock: req.body.stock ? parseInt(req.body.stock) : 0,
      source: req.body.source || 'manual',
      sourceUrl: req.body.sourceUrl || null,
      coverImage: req.body.coverImage || null,
      hasSpecs: req.body.hasSpecs || false,
      user: {
        connect: {
          id: req.user.id
        }
      }
    };

    const selection = await prisma.selection.create({
      data,
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        category: true,
        price: true,
        stock: true,
        source: true,
        sourceUrl: true,
        coverImage: true,
        hasSpecs: true,
        createdBy: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    res.json(selection);
  } catch (error) {
    handleError(error, res);
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
    const { 
      name, 
      description, 
      status, 
      category,
      price,
      stock,
      source,
      sourceUrl,
      coverImage,
      hasSpecs
    } = req.body;
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
        ...(name && { name }),
        ...(description && { description }),
        ...(status && { status }),
        ...(category && { category }),
        ...(price && { price: parseFloat(price) }),
        ...(stock && { stock: parseInt(stock) }),
        ...(source && { source }),
        ...(sourceUrl && { sourceUrl }),
        ...(coverImage && { coverImage }),
        ...(hasSpecs !== undefined && { hasSpecs }),
        updatedAt: new Date()
      },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        category: true,
        price: true,
        stock: true,
        source: true,
        sourceUrl: true,
        coverImage: true,
        hasSpecs: true,
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