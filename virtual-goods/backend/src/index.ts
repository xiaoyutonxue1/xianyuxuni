import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDB } from './config/database';
import logger from './utils/logger';
import { errorHandler } from './middlewares/errorHandler';
import { UPLOAD_DIR } from './config/upload';
import authRoutes from './routes/auth.routes';
import selectionsRoutes from './routes/selections.routes';
import productsRoutes from './routes/products.routes';
import storesRoutes from './routes/stores.routes';
import templatesRoutes from './routes/templates.routes';
import uploadRoutes from './routes/upload.routes';

const app = express();
const port = parseInt(process.env.PORT || '8080', 10);

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务
app.use('/uploads', express.static(UPLOAD_DIR));

// API Routes
const API_PREFIX = process.env.API_PREFIX || '/api/v1';
app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/selections`, selectionsRoutes);
app.use(`${API_PREFIX}/products`, productsRoutes);
app.use(`${API_PREFIX}/stores`, storesRoutes);
app.use(`${API_PREFIX}/templates`, templatesRoutes);
app.use(`${API_PREFIX}/upload`, uploadRoutes);

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 错误处理
app.use(errorHandler);

// 启动服务器
connectDB().then(() => {
  app.listen(port, '0.0.0.0', () => {
    logger.info(`Server is running on port ${port}`);
  });
}).catch(error => {
  logger.error('Failed to connect to database:', error);
  process.exit(1);
});

// 处理未捕获的异常
process.on('uncaughtException', error => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// 处理未处理的Promise拒绝
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
}); 