import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../types';
import { AppError } from '../middlewares/errorHandler';
import prisma from '../config/database';
import logger from '../utils/logger';
import { Prisma } from '@prisma/client';

// 生成Token
const generateTokens = (user: { id: number; username: string; role: string }) => {
  const accessToken = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET as string,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  const refreshToken = jwt.sign(
    { id: user.id },
    process.env.JWT_REFRESH_SECRET as string,
    { expiresIn: '30d' }
  );

  return { accessToken, refreshToken };
};

// 注册
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { username, password, email } = req.body;

    logger.info('Attempting to register new user:', { username, email });

    // 检查用户名是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { username }
    });

    if (existingUser) {
      logger.warn('Registration failed: Username already exists', { username });
      throw new AppError('用户名已存在', 400);
    }

    // 检查邮箱是否已存在
    if (email) {
      const existingEmail = await prisma.user.findFirst({
        where: { email }
      });

      if (existingEmail) {
        logger.warn('Registration failed: Email already exists', { email });
        throw new AppError('邮箱已被使用', 400);
      }
    }

    // 加密密码
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 创建用户
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        email,
        role: 'user',
        status: 'active'
      },
      select: {
        id: true,
        username: true,
        role: true
      }
    }).catch((error) => {
      logger.error('Failed to create user:', error);
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw error;
      }
      throw new AppError('注册失败，请稍后重试', 500);
    });

    // 生成Token
    const tokens = generateTokens(user);

    // 保存刷新Token
    await prisma.refreshToken.create({
      data: {
        token: tokens.refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30天
      }
    }).catch((error) => {
      logger.error('Failed to create refresh token:', error);
      throw new AppError('注册失败，请稍后重试', 500);
    });

    logger.info('User registered successfully:', { userId: user.id, username });

    res.status(201).json({
      message: '注册成功',
      data: {
        user: {
          id: user.id,
          username: user.username,
          role: user.role
        },
        ...tokens
      }
    });
  } catch (error) {
    logger.error('Registration error:', error);
    next(error);
  }
};

// 登录
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { username, password } = req.body;

    // 查找用户
    const user = await prisma.user.findUnique({
      where: { username }
    });

    if (!user || user.status !== 'active') {
      throw new AppError('用户名或密码错误', 401);
    }

    // 验证密码
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new AppError('用户名或密码错误', 401);
    }

    // 生成Token
    const tokens = generateTokens({
      id: user.id,
      username: user.username,
      role: user.role
    });

    // 保存刷新Token
    await prisma.refreshToken.create({
      data: {
        token: tokens.refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30天
      }
    });

    logger.info(`User logged in: ${username}`);

    res.json({
      message: '登录成功',
      data: {
        user: {
          id: user.id,
          username: user.username,
          role: user.role
        },
        ...tokens
      }
    });
  } catch (error) {
    next(error);
  }
};

// 刷新Token
export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { refreshToken } = req.body;

    // 验证刷新Token
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET as string
    ) as { id: number };

    // 检查Token是否存在且有效
    const tokenRecord = await prisma.refreshToken.findFirst({
      where: {
        token: refreshToken,
        userId: decoded.id,
        expiresAt: { gt: new Date() }
      }
    });

    if (!tokenRecord) {
      throw new AppError('无效的刷新Token', 401);
    }

    // 查找用户
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        username: true,
        role: true,
        status: true
      }
    });

    if (!user || user.status !== 'active') {
      throw new AppError('用户不存在或已禁用', 401);
    }

    // 生成新Token
    const tokens = generateTokens(user);

    // 删除旧的刷新Token
    await prisma.refreshToken.delete({
      where: { id: tokenRecord.id }
    });

    // 保存新的刷新Token
    await prisma.refreshToken.create({
      data: {
        token: tokens.refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30天
      }
    });

    res.json({
      message: 'Token刷新成功',
      data: tokens
    });
  } catch (error) {
    next(error);
  }
};

// 登出
export const logout = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError('未认证', 401);
    }

    // 删除用户的所有刷新Token
    await prisma.refreshToken.deleteMany({
      where: { userId: req.user.id }
    });

    logger.info(`User logged out: ${req.user.username}`);

    res.json({
      message: '登出成功'
    });
  } catch (error) {
    next(error);
  }
}; 