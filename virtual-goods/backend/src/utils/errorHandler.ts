import { Response } from 'express';
import logger from './logger';

export const handleError = (error: any, res: Response) => {
  logger.error('Error:', error);
  
  if (error.code === 'P2002') {
    return res.status(400).json({
      message: '记录已存在'
    });
  }
  
  if (error.code === 'P2025') {
    return res.status(404).json({
      message: '记录不存在'
    });
  }
  
  return res.status(500).json({
    message: '服务器内部错误'
  });
}; 