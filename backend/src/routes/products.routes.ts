import { Router } from 'express';
import { body, query } from 'express-validator';
import { auth, checkRole } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
} from '../controllers/products.controller';

const router = Router();

// 获取商品列表的验证规则
const getProductsValidation = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('pageSize').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('sortBy').optional().isString(),
  query('sortOrder').optional().isIn(['asc', 'desc']),
  query('status').optional().isString(),
  query('category').optional().isString(),
  query('keyword').optional().isString(),
  query('selectionId').optional().isInt().toInt(),
  query('storeId').optional().isInt().toInt(),
  validate
];

// 创建商品的验证规则
const createProductValidation = [
  body('title').notEmpty().withMessage('标题不能为空')
    .isLength({ max: 255 }).withMessage('标题长度不能超过255个字符'),
  body('description').optional()
    .isLength({ max: 1000 }).withMessage('描述长度不能超过1000个字符'),
  body('price').notEmpty().withMessage('价格不能为空')
    .isFloat({ min: 0 }).withMessage('价格必须大于等于0'),
  body('selectionId').notEmpty().withMessage('选品ID不能为空')
    .isInt().withMessage('选品ID必须是整数'),
  body('specs').optional().isArray().withMessage('规格必须是数组'),
  body('specs.*.name').optional().isString().withMessage('规格名称必须是字符串'),
  body('specs.*.value').optional().isString().withMessage('规格值必须是字符串'),
  body('specs.*.price').optional().isFloat({ min: 0 }).withMessage('规格价格必须大于等于0'),
  body('specs.*.stock').optional().isInt({ min: 0 }).withMessage('规格库存必须大于等于0'),
  validate
];

// 更新商品的验证规则
const updateProductValidation = [
  body('title').optional()
    .isLength({ max: 255 }).withMessage('标题长度不能超过255个字符'),
  body('description').optional()
    .isLength({ max: 1000 }).withMessage('描述长度不能超过1000个字符'),
  body('price').optional()
    .isFloat({ min: 0 }).withMessage('价格必须大于等于0'),
  body('status').optional()
    .isIn(['draft', 'pending', 'published', 'offline'])
    .withMessage('状态值无效'),
  body('specs').optional().isArray().withMessage('规格必须是数组'),
  body('specs.*.name').optional().isString().withMessage('规格名称必须是字符串'),
  body('specs.*.value').optional().isString().withMessage('规格值必须是字符串'),
  body('specs.*.price').optional().isFloat({ min: 0 }).withMessage('规格价格必须大于等于0'),
  body('specs.*.stock').optional().isInt({ min: 0 }).withMessage('规格库存必须大于等于0'),
  validate
];

// 路由定义
router.get('/', auth, getProductsValidation, getProducts);
router.get('/:id', auth, getProductById);
router.post('/', auth, createProductValidation, createProduct);
router.put('/:id', auth, updateProductValidation, updateProduct);
router.delete('/:id', auth, deleteProduct);

export default router; 