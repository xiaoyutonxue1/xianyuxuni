import { Router } from 'express';
import { body } from 'express-validator';
import { login, register, refreshToken, logout } from '../controllers/auth.controller';
import { auth } from '../middlewares/auth';
import { validate } from '../middlewares/validate';

const router = Router();

// 注册验证规则
const registerValidation = [
  body('username')
    .notEmpty().withMessage('用户名不能为空')
    .isLength({ min: 3, max: 20 }).withMessage('用户名长度必须在3-20之间')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('用户名只能包含字母、数字和下划线'),
  body('password')
    .notEmpty().withMessage('密码不能为空')
    .isLength({ min: 6 }).withMessage('密码长度不能小于6位')
    .matches(/\d/).withMessage('密码必须包含数字')
    .matches(/[a-zA-Z]/).withMessage('密码必须包含字母'),
  body('email')
    .optional()
    .isEmail().withMessage('邮箱格式不正确'),
  validate
];

// 登录验证规则
const loginValidation = [
  body('username').notEmpty().withMessage('用户名不能为空'),
  body('password').notEmpty().withMessage('密码不能为空'),
  validate
];

// 刷新Token验证规则
const refreshTokenValidation = [
  body('refreshToken').notEmpty().withMessage('刷新Token不能为空'),
  validate
];

// 路由
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.post('/refresh-token', refreshTokenValidation, refreshToken);
router.post('/logout', auth, logout);

export default router; 