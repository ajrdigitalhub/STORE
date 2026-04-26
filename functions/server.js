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

    // Add customizations fields to products if they don't exist
    await pool.query(`
      DO $$ 
      BEGIN 
        -- Products table columns
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='customizable') THEN
          ALTER TABLE products ADD COLUMN customizable BOOLEAN DEFAULT FALSE;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='customization_type') THEN
          ALTER TABLE products ADD COLUMN customization_type VARCHAR(50) DEFAULT 'none';
        END IF;

        -- Orders table columns for Razorpay
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='razorpay_orderid') THEN
          ALTER TABLE orders ADD COLUMN razorpay_orderid VARCHAR(255);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='razorpay_paymentid') THEN
          ALTER TABLE orders ADD COLUMN razorpay_paymentid VARCHAR(255);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='razorpay_signature') THEN
          ALTER TABLE orders ADD COLUMN razorpay_signature VARCHAR(500);
        END IF;

        -- WhatsApp logs table
        CREATE TABLE IF NOT EXISTS whatsapp_logs (
          id SERIAL PRIMARY KEY,
          recipient_number VARCHAR(20),
          message_content TEXT,
          status VARCHAR(50),
          reason TEXT,
          order_id INTEGER,
          user_id INTEGER,
          message_type VARCHAR(100),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      END $$;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS messages (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL,
          subject VARCHAR(255),
          message TEXT NOT NULL,
          status VARCHAR(50) DEFAULT 'new',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS whatsapp_logs (
          id SERIAL PRIMARY KEY,
          recipient_number VARCHAR(50),
          message_content TEXT,
          status VARCHAR(20),
          reason TEXT,
          order_id INTEGER,
          user_id INTEGER,
          message_type VARCHAR(50),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('Database initialized: config table, product customization fields, and whatsapp_logs table checked');
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
const chatRoutes = require('./routes/chats');
const Chat = require('./models/Chat');

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
app.use('/api/chats', chatRoutes);
app.use('/api/upload', express.raw({ type: 'multipart/form-data', limit: '10mb' }), (req, res, next) => {
  req.rawBody = req.body;
  next();
}, uploadRoutes);

// Socket.io
// Socket.io disabled as per user request
/*
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('join-admin', () => {
    socket.join('admin-room');
    console.log('Admin joined admin-room');
  });

  socket.on('join-customer', (userId) => {
    socket.join(userId.toString());
    console.log(`Customer ${userId} joined room ${userId}`);
  });

  socket.on('message', async (data) => {
    try {
      const { sender_id, sender_name, text, recipient_id, is_admin } = data;
      const timestamp = new Date().toISOString();
      const message = { sender_id, sender_name, text, timestamp };

      // Determine chat session
      const customerId = is_admin ? recipient_id : sender_id;
      const customerName = is_admin ? 'Customer' : sender_name; // Fallback

      let chat = await Chat.findByCustomer(customerId);
      if (!chat) {
        chat = await Chat.create({
          customer_id: customerId,
          customer_name: customerName,
          messages: [message]
        });
      } else {
        chat = await Chat.addMessage(chat.id, message);
      }

      // Broadcast to specific rooms
      if (is_admin) {
        // Admin sending to customer
        io.to(customerId.toString()).emit('message', message);
      } else {
        // Customer sending to admin
        io.to('admin-room').emit('message', { ...message, customer_id: customerId });
        // Also send back to customer for sync if they have multiple tabs
        socket.to(customerId.toString()).emit('message', message);
      }
      
      // Notify admins of new session/update
      io.to('admin-room').emit('chat-update', chat);

    } catch (error) {
      console.error('Socket message error:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});
*/

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
