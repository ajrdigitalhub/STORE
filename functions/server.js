const express = require('express');
const cors = require('cors');
const http = require('http');
const dotenv = require('dotenv');
const path = require('path');
const functions = require('firebase-functions');
dotenv.config();

const { initializeSocket } = require('./socket/chat');
const errorHandler = require('./middleware/errorHandler');

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

const app = express();
const server = http.createServer(app);
// const io = new Server(server, {
//   cors: {
//     origin: "*",
//     methods: ["GET", "POST"]
//   }
// });

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

// Socket.io
// io.on('connection', (socket) => {
//   console.log('A user connected:', socket.id);

//   socket.on('join-admin', () => {
//     socket.join('admin-room');
//   });

//   socket.on('join-customer', (userId) => {
//     socket.join(userId.toString());
//   });

//   socket.on('disconnect', () => {
//     console.log('User disconnected:', socket.id);
//   });
// });

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

// if (require.main === module) {
//   server.listen(port, () => {
//     console.log(`Server running on port ${port}`);
//   });
// }
exports.api = functions.https.onRequest(app);


// module.exports = { app, io };
