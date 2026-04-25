const express = require('express');
const Message = require('../models/Message');
const { adminAuth } = require('../middleware/auth');

const router = express.Router();

// POST /api/messages - Public: Submit a contact query
router.post('/', async (req, res, next) => {
  try {
    const { name, email, subject, message } = req.body;
    await Message.create({ name, email, subject, message });
    res.status(201).json({ message: 'Message sent successfully' });
  } catch (error) {
    next(error);
  }
});

// GET /api/messages - Admin: Get all contact queries
router.get('/', adminAuth, async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const result = await Message.findAll({ page: Number(page), limit: Number(limit), status });
    res.json({
      messages: result.messages,
      total: result.total,
      page: result.page,
      pages: Math.ceil(result.total / Number(limit))
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/messages/:id/read - Admin: Mark message as read
router.put('/:id/read', adminAuth, async (req, res, next) => {
  try {
    const result = await Message.updateStatus(req.params.id, 'read');
    if (!result) return res.status(404).json({ message: 'Message not found' });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/messages/:id - Admin: Delete message
router.delete('/:id', adminAuth, async (req, res, next) => {
  try {
    const success = await Message.delete(req.params.id);
    if (!success) return res.status(404).json({ message: 'Message not found' });
    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
