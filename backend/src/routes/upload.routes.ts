import { Router } from 'express';
import { uploadSingle, uploadMultiple, uploadFields } from '../config/upload';
import { auth } from '../middlewares/auth';
import { uploadFile, uploadFiles, uploadProductImages } from '../controllers/upload.controller';
import { body } from 'express-validator';
import { validate } from '../middlewares/validate';

const router = Router();

// 测试路由
router.get('/test', (req, res) => {
  res.json({ message: 'Upload route is working' });
});

// 单文件上传
router.post(
  '/single',
  auth,
  validate([
    body('type').optional().isString().isIn(['avatar', 'product', 'other']),
    body('description').optional().isString().trim()
  ]),
  uploadSingle,
  uploadFile
);

// 多文件上传
router.post(
  '/multiple',
  auth,
  validate([
    body('type').optional().isString().isIn(['product', 'other']),
    body('description').optional().isString().trim()
  ]),
  uploadMultiple,
  uploadFiles
);

// 商品图片上传（主图+详情图）
router.post(
  '/product',
  auth,
  validate([
    body('productId').optional().isInt(),
    body('description').optional().isString().trim()
  ]),
  uploadFields,
  uploadProductImages
);

export default router; 