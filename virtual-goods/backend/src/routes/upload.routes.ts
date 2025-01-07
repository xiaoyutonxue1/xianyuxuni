import { Router } from 'express';
import { auth } from '../middlewares/auth';
import { upload } from '../config/upload';
import { validateFileType } from '../middlewares/upload';
import { 
  uploadFile, 
  uploadFiles, 
  getFiles, 
  getFile, 
  deleteFile, 
  deleteFiles,
  updateFile 
} from '../controllers/upload.controller';

const router = Router();

// 测试路由
router.get('/test', (req, res) => {
  res.json({ message: 'Upload route is working (GET)' });
});

router.post('/test', (req, res) => {
  res.json({ message: 'Upload route is working (POST)' });
});

// 获取文件列表
router.get('/files', auth, getFiles);

// 获取文件详情
router.get('/files/:id', auth, getFile);

// 更新文件信息
router.put('/files/:id', auth, updateFile);

// 单文件上传
router.post(
  '/file',
  auth,
  upload.single('file'),
  validateFileType,
  uploadFile
);

// 多文件上传
router.post(
  '/files',
  auth,
  upload.array('files'),
  uploadFiles
);

// 删除单个文件
router.delete('/files/:id', auth, deleteFile);

// 批量删除文件
router.delete('/files', auth, deleteFiles);

export default router; 