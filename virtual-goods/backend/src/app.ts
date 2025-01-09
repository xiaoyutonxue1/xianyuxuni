import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { errorHandler } from './middlewares/errorHandler';
import { UPLOAD_DIR } from './config/upload';
import logger from './utils/logger';

// 导入路由
import authRoutes from './routes/auth.routes';
import selectionRoutes from './routes/selection.routes';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// 静态文件服务
app.use('/uploads', express.static(UPLOAD_DIR));

// 请求日志中间件
app.use((req, res, next) => {
  logger.info(`Incoming ${req.method} request to ${req.url}`, {
    headers: req.headers,
    query: req.query,
    body: req.body
  });
  next();
});

// API路由
const API_PREFIX = process.env.API_PREFIX || '/api/v1';
app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/selections`, selectionRoutes);

// Error Handler
app.use(errorHandler);

export default app; 