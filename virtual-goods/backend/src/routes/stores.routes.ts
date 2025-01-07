import { Router } from 'express';
import { body, query } from 'express-validator';
import { auth } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import {
  getStores,
  getStoreById,
  createStore,
  updateStore,
  deleteStore
} from '../controllers/stores.controller';

const router = Router();

// 获取店铺列表的验证规则
const getStoresValidation = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('pageSize').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('sortBy').optional().isString(),
  query('sortOrder').optional().isIn(['asc', 'desc']),
  query('status').optional().isString(),
  query('platform').optional().isString(),
  query('keyword').optional().isString(),
  validate
];

// 创建店铺的验证规则
const createStoreValidation = [
  body('name').notEmpty().withMessage('店铺名称不能为空')
    .isLength({ max: 255 }).withMessage('店铺名称长度不能超过255个字符'),
  body('platform').notEmpty().withMessage('平台不能为空')
    .isString().withMessage('平台必须是字符串'),
  body('config').notEmpty().withMessage('配置不能为空')
    .isObject().withMessage('配置必须是对象'),
  validate
];

// 更新店铺的验证规则
const updateStoreValidation = [
  body('name').optional()
    .isLength({ max: 255 }).withMessage('店铺名称长度不能超过255个字符'),
  body('platform').optional()
    .isString().withMessage('平台必须是字符串'),
  body('status').optional()
    .isIn(['active', 'inactive']).withMessage('状态值无效'),
  body('config').optional()
    .isObject().withMessage('配置必须是对象'),
  validate
];

// 路由定义
router.get('/', auth, getStoresValidation, getStores);
router.get('/:id', auth, getStoreById);
router.post('/', auth, createStoreValidation, createStore);
router.put('/:id', auth, updateStoreValidation, updateStore);
router.delete('/:id', auth, deleteStore);

export default router;