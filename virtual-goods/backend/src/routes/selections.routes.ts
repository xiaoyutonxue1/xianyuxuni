import { Router } from 'express';
import { body, query } from 'express-validator';
import { auth, checkRole } from '../middlewares/auth';
import { validate, paginationRules } from '../middlewares/validate';
import {
  getSelections,
  createSelection,
  updateSelection,
  deleteSelection
} from '../controllers/selections.controller';

const router = Router();

// 获取选品列表的验证规则
const getSelectionsValidation = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('pageSize').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('sortBy').optional().isString(),
  query('sortOrder').optional().isIn(['asc', 'desc']),
  query('status').optional().isString(),
  query('category').optional().isString(),
  query('keyword').optional().isString(),
  validate
];

// 创建选品的验证规则
const createSelectionValidation = [
  body('title').notEmpty().withMessage('标题不能为空')
    .isLength({ max: 255 }).withMessage('标题长度不能超过255个字符'),
  body('description').optional()
    .isLength({ max: 1000 }).withMessage('描述长度不能超过1000个字符'),
  body('type').notEmpty().withMessage('类型不能为空')
    .isIn(['manual', 'crawler']).withMessage('类型必须是manual或crawler'),
  body('source').notEmpty().withMessage('来源不能为空'),
  body('data').notEmpty().withMessage('数据不能为空')
    .isObject().withMessage('数据必须是对象类型'),
  validate
];

// 更新选品的验证规则
const updateSelectionValidation = [
  body('title').optional()
    .isLength({ max: 255 }).withMessage('标题长度不能超过255个字符'),
  body('description').optional()
    .isLength({ max: 1000 }).withMessage('描述长度不能超过1000个字符'),
  body('status').optional()
    .isIn(['draft', 'pending', 'distributed', 'inactive'])
    .withMessage('状态值无效'),
  body('data').optional()
    .isObject().withMessage('数据必须是对象类型'),
  validate
];

// 路由定义
router.get('/', auth, getSelectionsValidation, getSelections);
router.post('/', auth, createSelectionValidation, createSelection);
router.put('/:id', auth, updateSelectionValidation, updateSelection);
router.delete('/:id', auth, deleteSelection);

export default router; 