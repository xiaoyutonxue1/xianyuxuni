import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { AppError } from '../middlewares/errorHandler';
import prisma from '../config/database';
import { handlePagination, handleSort, formatResponse } from '../utils/helpers';
import logger from '../utils/logger';

// 获取商品列表
export const getProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { status, category, keyword, selectionId, storeId } = req.query;
    const { skip, take, page, pageSize } = handlePagination(req.query);
    const sort = handleSort(req.query.sortBy as string, req.query.sortOrder as 'asc' | 'desc');

    // 构建查询条件
    const where: any = {};
    if (status) where.status = status;
    if (category) where.category = category;
    if (selectionId) where.selectionId = Number(selectionId);
    if (storeId) {
      where.stores = {
        some: {
          id: Number(storeId)
        }
      };
    }
    if (keyword) {
      where.OR = [
        { title: { contains: keyword as string, mode: 'insensitive' } },
        { description: { contains: keyword as string, mode: 'insensitive' } }
      ];
    }

    // 查询数据
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take,
        orderBy: sort || { createdAt: 'desc' },
        include: {
          selection: {
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
            }
          },
          stores: {
            select: {
              id: true,
              name: true,
              platform: true
            }
          },
          user: {
            select: {
              id: true,
              username: true
            }
          }
        }
      }),
      prisma.product.count({ where })
    ]);

    res.json(formatResponse(
      { items: products, total, page, pageSize },
      '获取商品列表成功'
    ));
  } catch (error) {
    next(error);
  }
};

// 获取商品详情
export const getProductById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id: Number(id) },
      include: {
        selection: {
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
          }
        },
        stores: {
          select: {
            id: true,
            name: true,
            platform: true
          }
        },
        user: {
          select: {
            id: true,
            username: true
          }
        }
      }
    });

    if (!product) {
      throw new AppError('商品不存在', 404);
    }

    res.json(formatResponse(
      product,
      '获取商品详情成功'
    ));
  } catch (error) {
    next(error);
  }
};

// 创建商品
export const createProduct = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, description, price, selectionId, specs } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError('未认证', 401);
    }

    logger.info('Creating product with data:', {
      name,
      description,
      price,
      selectionId,
      specs,
      userId
    });

    // 检查选品是否存在
    const selection = await prisma.selection.findUnique({
      where: { id: Number(selectionId) }
    }).catch((error: unknown) => {
      logger.error('Error finding selection:', error);
      throw new AppError('数据库查询失败', 500);
    });

    if (!selection) {
      logger.error(`Selection not found: ${selectionId}`);
      throw new AppError('选品不存在', 404);
    }

    // 创建商品
    const product = await prisma.product.create({
      data: {
        name,
        description,
        price: Number(price),
        selectionId: Number(selectionId),
        status: 'draft',
        createdBy: userId,
        ...(specs && { specs: JSON.stringify(specs) })
      },
      include: {
        selection: {
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
          }
        },
        user: {
          select: {
            id: true,
            username: true
          }
        }
      }
    }).catch((error: unknown) => {
      logger.error('Error creating product:', error);
      if (error instanceof Error) {
        throw new AppError('创建商品失败: ' + error.message, 500);
      }
      throw new AppError('创建商品失败', 500);
    });

    logger.info(`Product created: ${product.id} by user ${userId}`);

    res.status(201).json(formatResponse(
      product,
      '创建商品成功'
    ));
  } catch (error: unknown) {
    logger.error('Error in createProduct:', error);
    if (error instanceof AppError) {
      next(error);
    } else if (error instanceof Error) {
      next(new AppError('服务器内部错误: ' + error.message, 500));
    } else {
      next(new AppError('服务器内部错误', 500));
    }
  }
};

// 更新商品
export const updateProduct = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { name, description, price, status, specs } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError('未认证', 401);
    }

    // 检查商品是否存在
    const existingProduct = await prisma.product.findUnique({
      where: { id: Number(id) }
    });

    if (!existingProduct) {
      throw new AppError('商品不存在', 404);
    }

    // 检查权限
    if (existingProduct.createdBy !== userId) {
      throw new AppError('无权限修改此商品', 403);
    }

    // 更新商品
    const product = await prisma.product.update({
      where: { id: Number(id) },
      data: {
        ...(name && { name }),
        ...(description && { description }),
        ...(price && { price }),
        ...(status && { status }),
        ...(specs && { specs: JSON.stringify(specs) }),
        updatedAt: new Date()
      },
      include: {
        selection: {
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
          }
        },
        stores: {
          select: {
            id: true,
            name: true,
            platform: true
          }
        },
        user: {
          select: {
            id: true,
            username: true
          }
        }
      }
    });

    logger.info(`Product updated: ${id} by user ${userId}`);

    res.json(formatResponse(
      product,
      '更新商品成功'
    ));
  } catch (error) {
    next(error);
  }
};

// 删除商品
export const deleteProduct = async (
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

    // 检查商品是否存在
    const existingProduct = await prisma.product.findUnique({
      where: { id: Number(id) }
    });

    if (!existingProduct) {
      throw new AppError('商品不存在', 404);
    }

    // 检查权限
    if (existingProduct.createdBy !== userId) {
      throw new AppError('无权限删除此商品', 403);
    }

    // 删除商品
    await prisma.product.delete({
      where: { id: Number(id) }
    });

    logger.info(`Product deleted: ${id} by user ${userId}`);

    res.json(formatResponse(
      null,
      '删除商品成功'
    ));
  } catch (error) {
    next(error);
  }
}; 