import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { AppError } from '../middlewares/errorHandler';
import prisma from '../config/database';
import { handlePagination, handleSort, formatResponse } from '../utils/helpers';
import logger from '../utils/logger';

// 获取店铺列表
export const getStores = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { status, platform, keyword } = req.query;
    const { skip, take, page, pageSize } = handlePagination(req.query);
    const sort = handleSort(req.query.sortBy as string, req.query.sortOrder as 'asc' | 'desc');

    // 构建查询条件
    const where: any = {};
    if (status) where.status = status;
    if (platform) where.platform = platform;
    if (keyword) {
      where.OR = [
        { name: { contains: keyword as string, mode: 'insensitive' } }
      ];
    }

    // 查询数据
    const [stores, total] = await Promise.all([
      prisma.store.findMany({
        where,
        skip,
        take,
        orderBy: sort || { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              username: true
            }
          },
          products: {
            select: {
              id: true,
              title: true,
              status: true
            }
          }
        }
      }),
      prisma.store.count({ where })
    ]);

    res.json(formatResponse(
      { items: stores, total, page, pageSize },
      '获取店铺列表成功'
    ));
  } catch (error) {
    next(error);
  }
};

// 获取店铺详情
export const getStoreById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const store = await prisma.store.findUnique({
      where: { id: Number(id) },
      include: {
        user: {
          select: {
            id: true,
            username: true
          }
        },
        products: {
          select: {
            id: true,
            title: true,
            status: true
          }
        }
      }
    });

    if (!store) {
      throw new AppError('店铺不存在', 404);
    }

    res.json(formatResponse(
      store,
      '获取店铺详情成功'
    ));
  } catch (error) {
    next(error);
  }
};

// 创建店铺
export const createStore = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, platform, config } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError('未认证', 401);
    }

    logger.info('Creating store with data:', {
      name,
      platform,
      config,
      userId
    });

    // 创建店铺
    const store = await prisma.store.create({
      data: {
        name,
        platform,
        config,
        status: 'active',
        createdBy: userId
      },
      include: {
        user: {
          select: {
            id: true,
            username: true
          }
        }
      }
    }).catch((error: unknown) => {
      logger.error('Error creating store:', error);
      if (error instanceof Error) {
        throw new AppError('创建店铺失败: ' + error.message, 500);
      }
      throw new AppError('创建店铺失败', 500);
    });

    logger.info(`Store created: ${store.id} by user ${userId}`);

    res.status(201).json(formatResponse(
      store,
      '创建店铺成功'
    ));
  } catch (error) {
    next(error);
  }
};

// 更新店铺
export const updateStore = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { name, platform, status, config } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError('未认证', 401);
    }

    // 检查店铺是否存在
    const existingStore = await prisma.store.findUnique({
      where: { id: Number(id) }
    });

    if (!existingStore) {
      throw new AppError('店铺不存在', 404);
    }

    // 检查权限
    if (existingStore.createdBy !== userId) {
      throw new AppError('无权限修改此店铺', 403);
    }

    // 更新店铺
    const store = await prisma.store.update({
      where: { id: Number(id) },
      data: {
        ...(name && { name }),
        ...(platform && { platform }),
        ...(status && { status }),
        ...(config && { config })
      },
      include: {
        user: {
          select: {
            id: true,
            username: true
          }
        }
      }
    });

    res.json(formatResponse(
      store,
      '更新店铺成功'
    ));
  } catch (error) {
    next(error);
  }
};

// 删除店铺
export const deleteStore = async (
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

    // 检查店铺是否存在
    const existingStore = await prisma.store.findUnique({
      where: { id: Number(id) }
    });

    if (!existingStore) {
      throw new AppError('店铺不存在', 404);
    }

    // 检查权限
    if (existingStore.createdBy !== userId) {
      throw new AppError('无权限删除此店铺', 403);
    }

    // 删除店铺
    await prisma.store.delete({
      where: { id: Number(id) }
    });

    res.json(formatResponse(
      null,
      '删除店铺成功'
    ));
  } catch (error) {
    next(error);
  }
}; 