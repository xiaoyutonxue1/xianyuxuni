import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';
import { ALLOWED_FILE_TYPES } from '../config/upload';

// 验证文件类型
export const validateFileType = (req: Request, res: Response, next: NextFunction) => {
  try {
    const file = req.file;
    const { type = 'file' } = req.body;

    if (!file) {
      throw new AppError('未上传文件', 400);
    }

    const isImage = ALLOWED_FILE_TYPES.image.includes(file.mimetype);
    const isAllowedFile = ALLOWED_FILE_TYPES.file.includes(file.mimetype);

    if (!isImage && !isAllowedFile) {
      throw new AppError('不支持的文件类型', 400);
    }

    next();
  } catch (error) {
    next(error);
  }
};

// 验证文件数量（用于多文件上传）
export const validateFileCount = (maxCount: number) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        throw new AppError('未上传文件', 400);
      }

      if (files.length > maxCount) {
        throw new AppError(`最多只能上传${maxCount}个文件`, 400);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}; 