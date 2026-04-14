const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();
const pool = require('./db');

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

// Export the app for Firebase
module.exports = { app };