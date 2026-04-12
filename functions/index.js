import express from 'express';
import cors from 'cors';
import fs from 'fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as functions from 'firebase-functions';

// Routes
import { productRoutes } from './routes/products.js';
import { paymentRoutes } from './routes/payments.js';
import { uploadRoutes } from './routes/upload.js';
import { orderRoutes } from './routes/orders.js';
import { authRoutes } from './routes/auth.js';
import { configRoutes } from './routes/config.js';
import categoryRoutes from './routes/categories.js';
import userRoutes from './routes/users.js';
import messageRoutes from './routes/messages.js';
import reviewRoutes from './routes/reviews.js';

// Config
import { serverConfig } from './config.js';

// Fix __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const createApp = () => {
  const app = express();

  console.log('🚀 Initializing Express app...');

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // ✅ Health check (VERY IMPORTANT for Cloud Run)
  app.get('/health', (req, res) => {
    res.status(200).send('OK');
  });

  // ✅ Safe static uploads (prevents crash if folder missing)
  try {
    const uploadsPath = join(__dirname, '../public/uploads');

    if (fs.existsSync(uploadsPath)) {
      app.use('/uploads', express.static(uploadsPath));
      console.log('📁 Serving uploads from:', uploadsPath);
    } else {
      console.warn('⚠️ uploads folder not found:', uploadsPath);
    }
  } catch (err) {
    console.error('❌ Error setting up uploads folder:', err);
  }

  // Runtime Config APIs
  app.get('/api/runtime-config', (req, res) => {
    res.json(serverConfig);
  });

  app.post('/api/runtime-config', (req, res) => {
    try {
      if (req.body && typeof req.body.useMockData === 'boolean') {
        serverConfig.useMockData = req.body.useMockData;
        res.json(serverConfig);
      } else {
        res.status(400).json({ error: 'Invalid config' });
      }
    } catch (err) {
      console.error('❌ Runtime config error:', err);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // ✅ Safe route loader (prevents crash if any route fails)
  const safeUse = (path, route) => {
    try {
      if (route) {
        app.use(path, route);
        console.log(`✅ Loaded route: ${path}`);
      } else {
        console.warn(`⚠️ Route undefined: ${path}`);
      }
    } catch (err) {
      console.error(`❌ Failed to load route ${path}:`, err);
    }
  };

  // API Routes (wrapped safely)
  safeUse('/api/products', productRoutes);
  safeUse('/api/payment', paymentRoutes);
  safeUse('/api/upload', uploadRoutes);
  safeUse('/api/orders', orderRoutes);
  safeUse('/api/auth', authRoutes);
  safeUse('/api/app-config', configRoutes);
  safeUse('/api/categories', categoryRoutes);
  safeUse('/api/users', userRoutes);
  safeUse('/api/messages', messageRoutes);
  safeUse('/api/reviews', reviewRoutes);

  // ✅ Global error handler (prevents crashes)
  app.use((err, req, res, next) => {
    console.error('🔥 Unhandled Error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  });

  return app;
};
