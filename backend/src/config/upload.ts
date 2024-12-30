import multer from 'multer';
import path from 'path';
import { Request } from 'express';
import { AppError } from '../middlewares/errorHandler';

// 配置文件存储
const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
    // 根据文件类型存储到不同目录
    let uploadPath = 'uploads/';
    if (file.mimetype.startsWith('image/')) {
      uploadPath += 'images/';
    } else {
      uploadPath += 'files/';
    }
    cb(null, uploadPath);
  },
  filename: (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    // 生成文件名：时间戳-原始文件名
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// 文件过滤器
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // 允许的文件类型
  const allowedMimes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp'
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('不支持的文件类型', 400));
  }
};

// 配置multer
export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 限制5MB
    files: 10 // 最多10个文件
  }
});

// 导出上传中间件
export const uploadSingle = upload.single('file');
export const uploadMultiple = upload.array('files', 10);
export const uploadFields = upload.fields([
  { name: 'mainImage', maxCount: 1 },
  { name: 'images', maxCount: 9 }
]); 