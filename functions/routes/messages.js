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

module.exports = router;
