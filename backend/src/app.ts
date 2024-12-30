import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { errorHandler } from './middlewares/errorHandler';
import authRoutes from './routes/auth.routes';
import selectionsRoutes from './routes/selections.routes';
import productsRoutes from './routes/products.routes';
import storesRoutes from './routes/stores.routes';
import templatesRoutes from './routes/templates.routes';
import logger from './utils/logger';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// 请求日志中间件
app.use((req, res, next) => {
  logger.info(`Incoming ${req.method} request to ${req.url}`, {
    headers: req.headers,
    query: req.query,
    body: req.body
  });
  next();
});

// API Routes
const API_PREFIX = process.env.API_PREFIX || '/api/v1';
app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/selections`, selectionsRoutes);
app.use(`${API_PREFIX}/products`, productsRoutes);
app.use(`${API_PREFIX}/stores`, storesRoutes);
app.use(`${API_PREFIX}/templates`, templatesRoutes);

// Error Handler
app.use(errorHandler);

export default app; 