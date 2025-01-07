import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';

// 创建Prisma客户端实例
const prisma = new PrismaClient({
  log: [
    {
      emit: 'event',
      level: 'query'
    },
    {
      emit: 'event',
      level: 'error'
    },
    {
      emit: 'event',
      level: 'info'
    },
    {
      emit: 'event',
      level: 'warn'
    }
  ]
});

// 监听Prisma事件
prisma.$on('query', e => {
  logger.debug('Query: ' + e.query);
  logger.debug('Params: ' + e.params);
  logger.debug('Duration: ' + e.duration + 'ms');
});

prisma.$on('error', e => {
  logger.error('Prisma Error:', e);
});

prisma.$on('info', e => {
  logger.info('Prisma Info:', e);
});

prisma.$on('warn', e => {
  logger.warn('Prisma Warning:', e);
});

// 连接数据库
export const connectDB = async () => {
  try {
    await prisma.$connect();
    logger.info('Successfully connected to database');
  } catch (error) {
    logger.error('Failed to connect to database:', error);
    process.exit(1);
  }
};

export default prisma; 