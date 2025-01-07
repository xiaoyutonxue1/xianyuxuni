import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { AppError } from '../middlewares/errorHandler';
import prisma from '../config/database';
import { handlePagination, handleSort, formatResponse } from '../utils/helpers';
import logger from '../utils/logger';
import { Prisma } from '@prisma/client';

// 获取模板列表
export const getTemplates = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { skip, take, page, pageSize } = handlePagination(req.query);
    const sort = handleSort(req.query.sortBy as string, req.query.sortOrder as 'asc' | 'desc');

    // 查询数据
    const [templates, total] = await Promise.all([
      prisma.template.findMany({
        skip,
        take,
        orderBy: sort || { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              username: true
            }
          }
        }
      }),
      prisma.template.count()
    ]);

    res.json(formatResponse(
      { items: templates, total, page, pageSize },
      '获取模板列表成功'
    ));
  } catch (error) {
    next(error);
  }
};

// 创建模板
export const createTemplate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, content, variables } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError('未认证', 401);
    }

    logger.info('Creating template with data:', {
      name,
      content,
      variables,
      userId
    });

    // 创建模板
    const template = await prisma.template.create({
      data: {
        name,
        content,
        variables: variables ? { value: variables } : undefined,
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
      logger.error('Error creating template:', error);
      if (error instanceof Error) {
        throw new AppError('创建模板失败: ' + error.message, 500);
      }
      throw new AppError('创建模板失败', 500);
    });

    logger.info(`Template created: ${template.id} by user ${userId}`);

    res.status(201).json(formatResponse(
      template,
      '创建模板成功'
    ));
  } catch (error: unknown) {
    logger.error('Error in createTemplate:', error);
    if (error instanceof AppError) {
      next(error);
    } else if (error instanceof Error) {
      next(new AppError('服务器内部错误: ' + error.message, 500));
    } else {
      next(new AppError('服务器内部错误', 500));
    }
  }
};

// 更新模板
export const updateTemplate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { name, content, variables } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError('未认证', 401);
    }

    // 检查模板是否存在
    const existingTemplate = await prisma.template.findUnique({
      where: { id: Number(id) }
    });

    if (!existingTemplate) {
      throw new AppError('模板不存在', 404);
    }

    // 检查权限
    if (existingTemplate.createdBy !== userId) {
      throw new AppError('无权限修改此模板', 403);
    }

    // 更新模板
    const template = await prisma.template.update({
      where: { id: Number(id) },
      data: {
        ...(name && { name }),
        ...(content && { content }),
        ...(variables && { variables: { value: variables } })
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
      template,
      '更新模板成功'
    ));
  } catch (error: unknown) {
    logger.error('Error in updateTemplate:', error);
    if (error instanceof AppError) {
      next(error);
    } else if (error instanceof Error) {
      next(new AppError('服务器内部错误: ' + error.message, 500));
    } else {
      next(new AppError('服务器内部错误', 500));
    }
  }
};

// 删除模板
export const deleteTemplate = async (
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

    // 检查模板是否存在
    const existingTemplate = await prisma.template.findUnique({
      where: { id: Number(id) }
    });

    if (!existingTemplate) {
      throw new AppError('模板不存在', 404);
    }

    // 检查权限
    if (existingTemplate.createdBy !== userId) {
      throw new AppError('无权限删除此模板', 403);
    }

    // 删除模板
    await prisma.template.delete({
      where: { id: Number(id) }
    });

    logger.info(`Template deleted: ${id} by user ${userId}`);

    res.json(formatResponse(
      null,
      '删除模板成功'
    ));
  } catch (error: unknown) {
    logger.error('Error in deleteTemplate:', error);
    if (error instanceof AppError) {
      next(error);
    } else if (error instanceof Error) {
      next(new AppError('服务器内部错误: ' + error.message, 500));
    } else {
      next(new AppError('服务器内部错误', 500));
    }
  }
};

// 应用模板
export const applyTemplate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { productId, variables } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError('未认证', 401);
    }

    // 检查模板是否存在
    const template = await prisma.template.findUnique({
      where: { id: Number(id) }
    });

    if (!template) {
      throw new AppError('模板不存在', 404);
    }

    // 检查商品是否存在
    const product = await prisma.product.findUnique({
      where: { id: Number(productId) }
    });

    if (!product) {
      throw new AppError('商品不存在', 404);
    }

    // 检查商品权限
    if (product.createdBy !== userId) {
      throw new AppError('无权限修改此商品', 403);
    }

    // 解析模板变量
    const templateVariables = template.variables ? (template.variables as { value: any[] }).value : [];
    
    // 验证必填变量
    const missingVariables = templateVariables
      .filter(v => v.required && !variables[v.name])
      .map(v => v.name);

    if (missingVariables.length > 0) {
      throw new AppError(`缺少必填变量: ${missingVariables.join(', ')}`, 400);
    }

    // 替换模板变量
    let content = template.content;
    let title = product.title;

    Object.entries(variables || {}).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      content = content.replace(regex, String(value));
      title = title.replace(regex, String(value));
    });

    // 更新商品
    const updatedProduct = await prisma.product.update({
      where: { id: Number(productId) },
      data: {
        distributedTitle: title,
        distributedContent: content,
        distributedAt: new Date()
      }
    });

    logger.info(`Template ${id} applied to product ${productId} by user ${userId}`);

    res.json(formatResponse(
      {
        title: updatedProduct.distributedTitle,
        content: updatedProduct.distributedContent
      },
      '应用模板成功'
    ));
  } catch (error: unknown) {
    logger.error('Error in applyTemplate:', error);
    if (error instanceof AppError) {
      next(error);
    } else if (error instanceof Error) {
      next(new AppError('服务器内部错误: ' + error.message, 500));
    } else {
      next(new AppError('服务器内部错误', 500));
    }
  }
}; 