import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

// 上传目录配置
export const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
export const TEMP_DIR = path.join(UPLOAD_DIR, 'temp');
export const IMAGE_DIR = path.join(UPLOAD_DIR, 'images');
export const FILE_DIR = path.join(UPLOAD_DIR, 'files');

// 文件类型限制
export const ALLOWED_FILE_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  file: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain'
  ]
};

// 创建上传目录
export const createUploadDirs = () => {
  [UPLOAD_DIR, TEMP_DIR, IMAGE_DIR, FILE_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

// Multer 存储配置
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const isImage = ALLOWED_FILE_TYPES.image.includes(file.mimetype);
    const uploadDir = isImage ? IMAGE_DIR : FILE_DIR;
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueId = uuidv4();
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueId}${ext}`);
  }
});

// Multer 配置
export const upload = multer({
  storage
}); 