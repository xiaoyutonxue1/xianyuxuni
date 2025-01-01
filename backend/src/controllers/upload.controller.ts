import { Request, Response, NextFunction } from 'express';
import { AppError } from '../middlewares/errorHandler';
import prisma from '../config/database';
import { AuthRequest } from '../types';
import fs from 'fs/promises';
import path from 'path';
import logger from '../utils/logger';

// 单文件上传处理
export const uploadFile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const file = req.file;
    const userId = req.user?.id;
    const { type = 'image', description = '' } = req.body;

    logger.info('开始处理文件上传', { userId, type, file });

    if (!userId) {
      throw new AppError('未认证', 401);
    }

    if (!file) {
      throw new AppError('未上传文件', 400);
    }

    // 检查文件类型
    const isImage = file.mimetype.startsWith('image/');
    if (type === 'image' && !isImage) {
      throw new AppError('文件类型必须是图片', 400);
    }

    // 保存文件信息到数据库
    const fileRecord = await prisma.file.create({
      data: {
        filename: file.filename,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        path: file.path,
        type: isImage ? 'image' : 'file',
        description,
        userId
      }
    });

    logger.info('文件信息已保存到数据库', { fileId: fileRecord.id });

    res.status(201).json({
      code: 201,
      message: '文件上传成功',
      data: {
        id: fileRecord.id,
        filename: fileRecord.filename,
        originalname: fileRecord.originalname,
        mimetype: fileRecord.mimetype,
        size: fileRecord.size,
        url: `/uploads/${file.filename}`,
        type: fileRecord.type,
        description: fileRecord.description
      }
    });
  } catch (error) {
    logger.error('文件上传失败', error);
    next(error);
  }
};

// 多文件上传处理
export const uploadFiles = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const files = req.files as Express.Multer.File[];
    const userId = req.user?.id;
    const { type = 'image', description = '' } = req.body;

    logger.info('开始处理多文件上传', { userId, type, fileCount: files?.length });

    if (!userId) {
      throw new AppError('未认证', 401);
    }

    if (!files || files.length === 0) {
      throw new AppError('未上传文件', 400);
    }

    // 检查文件类型
    if (type === 'image') {
      const hasNonImage = files.some(file => !file.mimetype.startsWith('image/'));
      if (hasNonImage) {
        throw new AppError('所有文件必须是图片', 400);
      }
    }

    // 保存所有文件信息到数据库
    const fileRecords = await Promise.all(
      files.map(async (file) => {
        const isImage = file.mimetype.startsWith('image/');
        return await prisma.file.create({
          data: {
            filename: file.filename,
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            path: file.path,
            type: isImage ? 'image' : 'file',
            description,
            userId
          }
        });
      })
    );

    logger.info('所有文件信息已保存到数据库', { fileIds: fileRecords.map(f => f.id) });

    res.status(201).json({
      code: 201,
      message: '文件上传成功',
      data: fileRecords.map(record => ({
        id: record.id,
        filename: record.filename,
        originalname: record.originalname,
        mimetype: record.mimetype,
        size: record.size,
        url: `/uploads/${record.filename}`,
        type: record.type,
        description: record.description
      }))
    });
  } catch (error) {
    logger.error('多文件上传失败', error);
    next(error);
  }
};

// 获取文件列表
export const getFiles = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { type, page, limit } = req.query;

    logger.info('开始获取文件列表', { userId, type, page, limit });

    if (!userId) {
      throw new AppError('未认证', 401);
    }

    // 构建查询条件
    const where = {
      userId,
      ...(type ? { type: type as string } : {})
    };

    // 分页参数
    const skip = page ? (Number(page) - 1) * (Number(limit) || 10) : 0;
    const take = limit ? Number(limit) : 10;

    // 查询文件列表和总数
    const [files, total] = await Promise.all([
      prisma.file.findMany({
        where,
        skip,
        take,
        orderBy: {
          createdAt: 'desc'
        },
        select: {
          id: true,
          filename: true,
          originalname: true,
          mimetype: true,
          size: true,
          type: true,
          description: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              username: true
            }
          }
        }
      }),
      prisma.file.count({ where })
    ]);

    logger.info('文件列表查询完成', { fileCount: files.length, total });

    // 处理响应数据
    const response = {
      code: 200,
      message: '获取文件列表成功',
      data: {
        list: files.map(file => ({
          ...file,
          url: `/uploads/${file.filename}`
        })),
        pagination: {
          total,
          page: Number(page) || 1,
          limit: Number(limit) || 10,
          totalPages: Math.ceil(total / (Number(limit) || 10))
        }
      }
    };

    res.json(response);
  } catch (error) {
    logger.error('获取文件列表失败', error);
    next(error);
  }
};

// 获取文件详情
export const getFile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const fileId = Number(req.params.id);

    logger.info('开始获取文件详情', { userId, fileId });

    if (!userId) {
      throw new AppError('未认证', 401);
    }

    const file = await prisma.file.findUnique({
      where: {
        id: fileId
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

    if (!file) {
      throw new AppError('文件不存在', 404);
    }

    if (file.userId !== userId) {
      throw new AppError('无权访问此文件', 403);
    }

    logger.info('文件详情获取成功', { fileId });

    res.json({
      code: 200,
      message: '获取文件详情成功',
      data: {
        ...file,
        url: `/uploads/${file.filename}`
      }
    });
  } catch (error) {
    logger.error('获取文件详情失败', error);
    next(error);
  }
};

// 删除文件
export const deleteFile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const fileId = Number(req.params.id);

    logger.info('开始删除文件', { userId, fileId });

    if (!userId) {
      throw new AppError('未认证', 401);
    }

    const file = await prisma.file.findUnique({
      where: {
        id: fileId
      }
    });

    if (!file) {
      throw new AppError('文件不存在', 404);
    }

    if (file.userId !== userId) {
      throw new AppError('无权删除此文件', 403);
    }

    // 删除物理文件
    await fs.unlink(file.path);

    // 删除数据库记录
    await prisma.file.delete({
      where: {
        id: fileId
      }
    });

    logger.info('文件删除成功', { fileId });

    res.json({
      code: 200,
      message: '文件删除成功'
    });
  } catch (error) {
    logger.error('删除文件失败', error);
    next(error);
  }
};

// 批量删除文件
export const deleteFiles = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { ids } = req.body as { ids: number[] };

    logger.info('开始批量删除文件', { userId, fileIds: ids });

    if (!userId) {
      throw new AppError('未认证', 401);
    }

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      throw new AppError('请选择要删除的文件', 400);
    }

    // 首先检查所有文件是否存在
    const existingFiles = await prisma.file.findMany({
      where: {
        id: { in: ids }
      }
    });

    // 找出不存在的文件ID
    const existingIds = existingFiles.map(f => f.id);
    const nonExistentIds = ids.filter(id => !existingIds.includes(id));

    // 找出无权访问的文件
    const unauthorizedFiles = existingFiles.filter(f => f.userId !== userId);
    const unauthorizedIds = unauthorizedFiles.map(f => f.id);

    // 找出可以删除的文件
    const filesToDelete = existingFiles.filter(f => f.userId === userId);

    // 即使没有可删除的文件也继续处理,只是在结果中说明原因
    let deleteResults: PromiseSettledResult<{id: number; success: boolean; error?: string}>[] = [];
    
    if (filesToDelete.length > 0) {
      // 使用事务处理删除操作
      deleteResults = await prisma.$transaction(async (tx) => {
        // 删除数据库记录
        await tx.file.deleteMany({
          where: {
            id: { in: filesToDelete.map(f => f.id) },
            userId
          }
        });

        // 删除物理文件
        const results = await Promise.allSettled(
          filesToDelete.map(async file => {
            try {
              await fs.unlink(file.path);
              return { id: file.id, success: true };
            } catch (error) {
              logger.error(`删除物理文件失败: ${file.path}`, error);
              return { 
                id: file.id, 
                success: false, 
                error: error instanceof Error ? error.message : '未知错误'
              };
            }
          })
        );

        return results;
      });
    }

    // 统计删除结果
    const successResults = deleteResults.filter(
      (result): result is PromiseFulfilledResult<{id: number; success: boolean}> => 
        result.status === 'fulfilled' && result.value.success
    );
    
    const failedResults = deleteResults.filter(
      result => result.status === 'rejected' || (result.status === 'fulfilled' && !result.value.success)
    ).map(result => {
      if (result.status === 'rejected') {
        return { id: -1, error: result.reason };
      }
      return (result as PromiseFulfilledResult<{id: number; success: boolean; error?: string}>).value;
    });

    // 构建详细的响应信息
    const response = {
      code: 200,
      message: '文件删除处理完成',
      data: {
        summary: {
          total: ids.length,
          success: successResults.length,
          failed: failedResults.length + nonExistentIds.length + unauthorizedIds.length
        },
        details: {
          successful: successResults.map(r => r.value.id),
          nonExistent: nonExistentIds,
          unauthorized: unauthorizedIds,
          deleteFailed: failedResults.map(r => ({
            id: r.id,
            reason: r.error
          }))
        }
      }
    };

    res.json(response);
  } catch (error) {
    logger.error('批量删除文件失败', error);
    next(error);
  }
};

// 更新文件信息
export const updateFile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const fileId = Number(req.params.id);
    const { description, type } = req.body;

    logger.info('开始更新文件信息', { userId, fileId, description, type });

    if (!userId) {
      throw new AppError('未认证', 401);
    }

    // 检查文件是否存在且属于当前用户
    const file = await prisma.file.findFirst({
      where: {
        id: fileId,
        userId
      }
    });

    if (!file) {
      throw new AppError('文件不存在或无权访问', 404);
    }

    // 验证文件类型
    if (type && !['image', 'file'].includes(type)) {
      throw new AppError('不支持的文件类型', 400);
    }

    // 更新文件信息
    const updatedFile = await prisma.file.update({
      where: {
        id: fileId
      },
      data: {
        description: description || file.description,
        type: type || file.type,
        updatedAt: new Date()
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

    logger.info('文件信息更新成功', { fileId });

    res.json({
      code: 200,
      message: '文件信息更新成功',
      data: {
        ...updatedFile,
        url: `/uploads/${updatedFile.filename}`
      }
    });
  } catch (error) {
    logger.error('更新文件信息失败', error);
    next(error);
  }
}; 