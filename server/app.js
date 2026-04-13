import express from 'express';
import cors from 'cors';
import { productRoutes } from './routes/products.js';
import { paymentRoutes } from './routes/payments.js';
import { uploadRoutes } from './routes/upload.js';
import { orderRoutes } from './routes/orders.js';
import { authRoutes } from './routes/auth.js';
import { configRoutes } from './routes/config.js';
import categoryRoutes from './routes/categories.js';
import userRoutes from './routes/users.js';
import messageRoutes from './routes/messages.js';
import { serverConfig } from './config.js';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const createApp = () => {
  const app = express();
  
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Serve uploaded files statically
  app.use('/uploads', express.static(join(__dirname, '../public/uploads')));

  // Server Runtime Config
  app.get('/api/runtime-config', (req, res) => {
    res.json(serverConfig);
  });

  app.post('/api/runtime-config', (req, res) => {
    if (req.body && typeof req.body.useMockData === 'boolean') {
      serverConfig.useMockData = req.body.useMockData;
      res.json(serverConfig);
    } else {
      res.status(400).json({ error: 'Invalid config' });
    }
  });

  // API Routes
  app.use('/api/products', productRoutes);
  app.use('/api/payment', paymentRoutes);
  app.use('/api/upload', uploadRoutes);
  app.use('/api/orders', orderRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/app-config', configRoutes);
  app.use('/api/categories', categoryRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/messages', messageRoutes);

  return app;
};
