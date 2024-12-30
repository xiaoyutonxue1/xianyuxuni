import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { errorHandler } from './middlewares/errorHandler';
import authRoutes from './routes/auth.routes';
import selectionsRoutes from './routes/selections.routes';
import productsRoutes from './routes/products.routes';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// API Routes
const API_PREFIX = process.env.API_PREFIX || '/api/v1';
app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/selections`, selectionsRoutes);
app.use(`${API_PREFIX}/products`, productsRoutes);

// Error Handler
app.use(errorHandler);

export default app; 