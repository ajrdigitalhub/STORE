const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();
const pool = require('./db');

async function initDB() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS config (
          key VARCHAR(255) PRIMARY KEY,
          value JSONB NOT NULL,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Database initialized: config table checked');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

initDB();

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const categoryRoutes = require('./routes/categories');
const orderRoutes = require('./routes/orders');
const paymentRoutes = require('./routes/payment');
const messageRoutes = require('./routes/messages');
const contactConfigRoutes = require('./routes/contact-config');
const paymentConfigRoutes = require('./routes/paymentConfig');
const appConfigRoutes = require('./routes/app-config');
const userRoutes = require('./routes/users');
const uploadRoutes = require('./routes/upload');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date(), env: process.env.NODE_ENV });
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/contact-config', contactConfigRoutes);
app.use('/api/payment-config', paymentConfigRoutes);
app.use('/api/app-config', appConfigRoutes);
app.use('/api/users', userRoutes);
app.use('/api/upload', express.raw({ type: 'multipart/form-data', limit: '10mb' }), (req, res, next) => {
  req.rawBody = req.body;
  next();
}, uploadRoutes);

// Socket.io
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('join-admin', () => {
    socket.join('admin-room');
  });

  socket.on('join-customer', (userId) => {
    socket.join(userId.toString());
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

const port = process.env.PORT || 3000;

// Serve static files
const browserDistPath = path.join(__dirname, '../dist/app/browser');
app.use(express.static(browserDistPath));

app.get(/^(?!\/api).*/, (req, res) => {
  const indexPath = path.join(browserDistPath, 'index.html');
  const csrIndexPath = path.join(browserDistPath, 'index.csr.html');

  if (require('fs').existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else if (require('fs').existsSync(csrIndexPath)) {
    res.sendFile(csrIndexPath);
  } else {
    res.status(404).send('Frontend not found. Please run npm run build.');
  }
});

if (require.main === module) {
  server.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

module.exports = { app, io };
