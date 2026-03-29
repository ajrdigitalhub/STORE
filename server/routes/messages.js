const express = require('express');
const Message = require('../models/Message');
const { adminAuth } = require('../middleware/auth');

const router = express.Router();

// POST /api/messages - Public: Submit a contact query
router.post('/', async (req, res, next) => {
  try {
    const { name, email, subject, message } = req.body;
    const newMessage = new Message({ name, email, subject, message });
    await newMessage.save();
    res.status(201).json({ message: 'Message sent successfully' });
  } catch (error) {
    next(error);
  }
});

// GET /api/messages - Admin: Get all contact queries
router.get('/', adminAuth, async (req, res, next) => {
  try {
    const messages = await Message.find().sort({ createdAt: -1 });
    res.json(messages);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/messages/:id - Admin: Update message status
router.patch('/:id', adminAuth, async (req, res, next) => {
  try {
    const { status } = req.body;
    const message = await Message.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }
    res.json(message);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/messages/:id - Admin: Delete a message
router.delete('/:id', adminAuth, async (req, res, next) => {
  try {
    const message = await Message.findByIdAndDelete(req.params.id);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }
    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
