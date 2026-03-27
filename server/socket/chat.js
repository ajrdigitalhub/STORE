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

        let chat = await Chat.findOne({ customer: socket.userId });
        if (!chat) {
          chat = new Chat({
            customer: socket.userId,
            customerName: customerName || 'Customer',
            messages: []
          });
        }

        const message = {
          sender: 'customer',
          senderName: customerName || 'Customer',
          text,
          timestamp: new Date()
        };

        chat.messages.push(message);
        chat.lastMessage = text;
        chat.lastMessageAt = new Date();
        chat.isActive = true;
        await chat.save();

        // Emit to admin room
        io.to('admin-room').emit('admin:newMessage', {
          chatId: chat._id,
          customerId: socket.userId,
          customerName: chat.customerName,
          message
        });

        // Acknowledge to sender
        socket.emit('message:sent', { message, chatId: chat._id });
      } catch (err) {
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Admin sends message to customer
    socket.on('admin:send', async (data) => {
      try {
        const { text, customerId, adminName } = data;

        let chat = await Chat.findOne({ customer: customerId });
        if (!chat) {
          return socket.emit('error', { message: 'Chat not found' });
        }

        const message = {
          sender: 'admin',
          senderName: adminName || 'Admin',
          text,
          timestamp: new Date()
        };

        chat.messages.push(message);
        chat.lastMessage = text;
        chat.lastMessageAt = new Date();
        await chat.save();

        // Emit to the customer
        io.to(customerId).emit('customer:newMessage', { message, chatId: chat._id });

        // Emit back to admin room
        io.to('admin-room').emit('admin:messageUpdate', {
          chatId: chat._id,
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
        const chat = await Chat.findOne({ customer: customerId });
        socket.emit('chat:history', {
          chatId: chat?._id,
          messages: chat?.messages || [],
          customerName: chat?.customerName || ''
        });
      } catch (err) {
        socket.emit('error', { message: 'Failed to load chat history' });
      }
    });

    // Get all active chats (admin)
    socket.on('admin:getChats', async () => {
      try {
        if (socket.userRole !== 'admin') return;
        const chats = await Chat.find({ isActive: true })
          .sort('-lastMessageAt')
          .populate('customer', 'name email');
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
