import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { AppError } from '../middlewares/errorHandler';
import prisma from '../config/database';
import { formatResponse } from '../utils/helpers';
import logger from '../utils/logger';
import path from 'path';
import fs from 'fs';

// 确保上传目录存在
const createUploadDirs = () => {
  const dirs = ['uploads/images', 'uploads/files'];
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

// 创建上传目录
createUploadDirs();

// 单文件上传
export const uploadFile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const file = req.file;
    const { type = 'other', description } = req.body;
    const userId = req.user?.id;

    if (!file) {
      throw new AppError('未找到上传的文件', 400);
    }

    if (!userId) {
      throw new AppError('未认证', 401);
    }

    // 记录文件信息到数据库
    const fileRecord = await prisma.file.create({
      data: {
        filename: file.filename,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        path: file.path,
        type,
        description,
        uploadedBy: userId
      }
    });

    logger.info(`File uploaded: ${fileRecord.id} by user ${userId}`);

    res.json(formatResponse(
      fileRecord,
      '文件上传成功'
    ));
  } catch (error) {
    next(error);
  }
};

// 多文件上传
export const uploadFiles = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const files = req.files as Express.Multer.File[];
    const { type = 'other', description } = req.body;
    const userId = req.user?.id;

    if (!files || files.length === 0) {
      throw new AppError('未找到上传的文件', 400);
    }

    if (!userId) {
      throw new AppError('未认证', 401);
    }

    // 批量记录文件信息到数据库
    const fileRecords = await Promise.all(files.map(file => 
      prisma.file.create({
        data: {
          filename: file.filename,
          originalname: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          path: file.path,
          type,
          description,
          uploadedBy: userId
        }
      })
    ));

    logger.info(`${fileRecords.length} files uploaded by user ${userId}`);

    res.json(formatResponse(
      { files: fileRecords },
      '文件上传成功'
    ));
  } catch (error) {
    next(error);
  }
};

// 商品图片上传
export const uploadProductImages = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const { productId, description } = req.body;
    const userId = req.user?.id;

    if (!files || (!files.mainImage && !files.images)) {
      throw new AppError('未找到上传的文件', 400);
    }

    if (!userId) {
      throw new AppError('未认证', 401);
    }

    // 处理主图
    let mainImageRecord;
    if (files.mainImage && files.mainImage[0]) {
      const mainImage = files.mainImage[0];
      mainImageRecord = await prisma.file.create({
        data: {
          filename: mainImage.filename,
          originalname: mainImage.originalname,
          mimetype: mainImage.mimetype,
          size: mainImage.size,
          path: mainImage.path,
          type: 'product',
          description,
          uploadedBy: userId
        }
      });
    }

    // 处理详情图
    let imageRecords;
    if (files.images && files.images.length > 0) {
      imageRecords = await Promise.all(files.images.map(file => 
        prisma.file.create({
          data: {
            filename: file.filename,
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            path: file.path,
            type: 'product',
            description,
            uploadedBy: userId
          }
        })
      ));
    }

    // 如果提供了商品ID，更新商品图片
    if (productId) {
      const product = await prisma.product.findUnique({
        where: { id: Number(productId) }
      });

      if (!product) {
        throw new AppError('商品不存在', 404);
      }

      if (product.createdBy !== userId) {
        throw new AppError('无权限修改此商品', 403);
      }

      // 更新商品图片信息
      await prisma.product.update({
        where: { id: Number(productId) },
        data: {
          ...(mainImageRecord && { mainImage: mainImageRecord.path }),
          ...(imageRecords && { images: imageRecords.map(record => record.path) })
        }
      });
    }

    logger.info(`Product images uploaded for product ${productId} by user ${userId}`);

    res.json(formatResponse(
      {
        mainImage: mainImageRecord,
        images: imageRecords
      },
      '图片上传成功'
    ));
  } catch (error) {
    next(error);
  }
}; 