import { Router } from 'express';
import { body, query } from 'express-validator';
import { auth } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import {
  getTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  applyTemplate
} from '../controllers/templates.controller';

const router = Router();

// 获取模板列表的验证规则
const getTemplatesValidation = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('pageSize').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('sortBy').optional().isString(),
  query('sortOrder').optional().isIn(['asc', 'desc']),
  validate
];

// 创建模板的验证规则
const createTemplateValidation = [
  body('name').notEmpty().withMessage('模板名称不能为空')
    .isLength({ max: 100 }).withMessage('模板名称长度不能超过100个字符'),
  body('content').notEmpty().withMessage('模板内容不能为空'),
  body('variables').optional().isArray().withMessage('变量必须是数组'),
  body('variables.*.name').optional().isString().withMessage('变量名称必须是字符串'),
  body('variables.*.type').optional().isString().withMessage('变量类型必须是字符串'),
  body('variables.*.defaultValue').optional(),
  body('variables.*.required').optional().isBoolean().withMessage('required必须是布尔值'),
  validate
];

// 更新模板的验证规则
const updateTemplateValidation = [
  body('name').optional()
    .isLength({ max: 100 }).withMessage('模板名称长度不能超过100个字符'),
  body('content').optional(),
  body('variables').optional().isArray().withMessage('变量必须是数组'),
  body('variables.*.name').optional().isString().withMessage('变量名称必须是字符串'),
  body('variables.*.type').optional().isString().withMessage('变量类型必须是字符串'),
  body('variables.*.defaultValue').optional(),
  body('variables.*.required').optional().isBoolean().withMessage('required必须是布尔值'),
  validate
];

// 应用模板的验证规则
const applyTemplateValidation = [
  body('productId').notEmpty().withMessage('商品ID不能为空')
    .isInt().withMessage('商品ID必须是整数'),
  body('variables').optional().isObject().withMessage('变量必须是对象'),
  validate
];

// 路由定义
router.get('/', auth, getTemplatesValidation, getTemplates);
router.post('/', auth, createTemplateValidation, createTemplate);
router.put('/:id', auth, updateTemplateValidation, updateTemplate);
router.delete('/:id', auth, deleteTemplate);
router.post('/:id/apply', auth, applyTemplateValidation, applyTemplate);

export default router; 