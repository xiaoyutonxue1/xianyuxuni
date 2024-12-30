import { Request, Response, NextFunction } from 'express';
import { ValidationChain, validationResult } from 'express-validator';
import { AppError } from './errorHandler';

export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // 执行所有验证
    await Promise.all(validations.map(validation => validation.run(req)));

    // 检查验证结果
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError('验证失败: ' + JSON.stringify(errors.array()), 400));
    }

    next();
  };
};

// 分页验证规则
export const paginationRules: ValidationChain[] = [
  // 页码验证
  {
    in: ['query'],
    name: 'page',
    optional: true,
    isInt: {
      options: { min: 1 },
      errorMessage: '页码必须是大于0的整数'
    },
    toInt: true
  },
  // 每页数量验证
  {
    in: ['query'],
    name: 'pageSize',
    optional: true,
    isInt: {
      options: { min: 1, max: 100 },
      errorMessage: '每页数量必须是1-100之间的整数'
    },
    toInt: true
  },
  // 排序字段验证
  {
    in: ['query'],
    name: 'sortBy',
    optional: true,
    isString: true,
    errorMessage: '排序字段必须是字符串'
  },
  // 排序方向验证
  {
    in: ['query'],
    name: 'sortOrder',
    optional: true,
    isIn: {
      options: [['asc', 'desc']],
      errorMessage: '排序方向必须是asc或desc'
    }
  }
] as unknown as ValidationChain[];

// 日期范围验证规则
export const dateRangeRules: ValidationChain[] = [
  // 开始日期验证
  {
    in: ['query'],
    name: 'startDate',
    optional: true,
    isISO8601: {
      options: { strict: true },
      errorMessage: '开始日期必须是有效的ISO8601格式'
    }
  },
  // 结束日期验证
  {
    in: ['query'],
    name: 'endDate',
    optional: true,
    isISO8601: {
      options: { strict: true },
      errorMessage: '结束日期必须是有效的ISO8601格式'
    },
    custom: {
      options: (value: string, { req }: { req: Request }) => {
        if (value && req.query.startDate) {
          const startDate = new Date(req.query.startDate as string);
          const endDate = new Date(value);
          if (endDate < startDate) {
            throw new Error('结束日期不能早于开始日期');
          }
        }
        return true;
      }
    }
  }
] as unknown as ValidationChain[];

// ID参数验证规则
export const idParamRules: ValidationChain[] = [
  {
    in: ['params'],
    name: 'id',
    isInt: {
      options: { min: 1 },
      errorMessage: 'ID必须是大于0的整数'
    },
    toInt: true
  }
] as unknown as ValidationChain[]; 