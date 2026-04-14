const express = require('express');
const Chat = require('../models/Chat');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/chats/active - Admin: Get all active chat sessions
router.get('/active', adminAuth, async (req, res, next) => {
  try {
    const chats = await Chat.findAllActive();
    res.json(chats);
  } catch (error) {
    next(error);
  }
});

// GET /api/chats/history - Customer: Get own chat history
router.get('/history', auth, async (req, res, next) => {
  try {
    const chat = await Chat.findByCustomer(req.userId);
    res.json(chat);
  } catch (error) {
    next(error);
  }
});

// POST /api/chats/status - Admin: Close/Open chat
router.post('/:id/status', adminAuth, async (req, res, next) => {
  try {
    const { isActive } = req.body;
    const chat = await Chat.updateStatus(req.params.id, isActive);
    res.json(chat);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
