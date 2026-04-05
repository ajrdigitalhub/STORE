const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const Chat = require('../models/Chat');

let io;

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:4200',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Auth middleware for socket
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication required'));

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      socket.userRole = decoded.role;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userId} (${socket.userRole})`);

    // Join user's own room
    socket.join(socket.userId);

    // Admin joins admin room
    if (socket.userRole === 'admin') {
      socket.join('admin-room');
    }

    // Customer sends message
    socket.on('customer:send', async (data) => {
      try {
        const { text, customerName } = data;

        let chat = await Chat.findByCustomer(socket.userId);
        if (!chat) {
          chat = await Chat.create({
            customerid: socket.userId,
            customer_name: customerName || 'Customer'
          });
        }

        const message = {
          sender: 'customer',
          senderName: customerName || 'Customer',
          text,
          timestamp: new Date()
        };

        chat = await Chat.addMessage(chat.id, message);

        // Emit to admin room
        io.to('admin-room').emit('admin:newMessage', {
          chatId: chat.id,
          customerId: socket.userId,
          customerName: chat.customer_name,
          message
        });

        // Acknowledge to sender
        socket.emit('message:sent', { message, chatId: chat.id });
      } catch (err) {
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Admin sends message to customer
    socket.on('admin:send', async (data) => {
      try {
        const { text, customerId, adminName } = data;

        let chat = await Chat.findByCustomer(customerId);
        if (!chat) {
          return socket.emit('error', { message: 'Chat not found' });
        }

        const message = {
          sender: 'admin',
          senderName: adminName || 'Admin',
          text,
          timestamp: new Date()
        };

        chat = await Chat.addMessage(chat.id, message);

        // Emit to the customer
        io.to(customerId).emit('customer:newMessage', { message, chatId: chat.id });

        // Emit back to admin room
        io.to('admin-room').emit('admin:messageUpdate', {
          chatId: chat.id,
          customerId,
          message
        });
      } catch (err) {
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Get chat history
    socket.on('chat:history', async (data) => {
      try {
        const customerId = socket.userRole === 'admin' ? data.customerId : socket.userId;
        const chat = await Chat.getHistory(customerId);
        socket.emit('chat:history', {
          chatId: chat?.id,
          messages: chat?.messages || [],
          customerName: chat?.customer_name || ''
        });
      } catch (err) {
        socket.emit('error', { message: 'Failed to load chat history' });
      }
    });

    // Get all active chats (admin)
    socket.on('admin:getChats', async () => {
      try {
        if (socket.userRole !== 'admin') return;
        const chats = await Chat.findAllActive();
        socket.emit('admin:chatList', chats);
      } catch (err) {
        socket.emit('error', { message: 'Failed to load chats' });
      }
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userId}`);
    });
  });

  return io;
};

const getIO = () => io;

module.exports = { initializeSocket, getIO };
