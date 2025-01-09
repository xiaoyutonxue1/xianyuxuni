import { Router } from 'express';
import { body } from 'express-validator';
import { getSelections, createSelection, updateSelection } from '../controllers/selections.controller';
import { auth } from '../middlewares/auth';
import { validate } from '../middlewares/validate';

const router = Router();

// 创建选品验证规则
const createSelectionValidation = [
  body('name').notEmpty().withMessage('名称不能为空'),
  body('description').optional(),
  body('status').optional().isIn(['draft', 'active', 'inactive']).withMessage('状态值无效'),
  body('category').optional(),
  body('price').optional().isNumeric().withMessage('价格必须是数字'),
  body('stock').optional().isInt().withMessage('库存必须是整数'),
  body('source').optional(),
  body('sourceUrl').optional().isURL().withMessage('来源URL格式不正确'),
  body('coverImage').optional(),
  body('hasSpecs').optional().isBoolean().withMessage('hasSpecs必须是布尔值'),
  validate
];

// 更新选品验证规则
const updateSelectionValidation = [
  body('name').optional().notEmpty().withMessage('名称不能为空'),
  body('description').optional(),
  body('status').optional().isIn(['draft', 'active', 'inactive']).withMessage('状态值无效'),
  body('category').optional(),
  body('price').optional().isNumeric().withMessage('价格必须是数字'),
  body('stock').optional().isInt().withMessage('库存必须是整数'),
  body('source').optional(),
  body('sourceUrl').optional().isURL().withMessage('来源URL格式不正确'),
  body('coverImage').optional(),
  body('hasSpecs').optional().isBoolean().withMessage('hasSpecs必须是布尔值'),
  validate
];

// 路由
router.get('/', auth, getSelections);
router.post('/', auth, createSelectionValidation, createSelection);
router.put('/:id', auth, updateSelectionValidation, updateSelection);

export default router; 