const express = require('express');
const User = require('../models/User');
const { adminAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/users — admin only
router.get('/', adminAuth, async (req, res, next) => {
  try {
    const { page = 1, limit = 100, search = '' } = req.query;
    const result = await User.findAll({ 
      page: Number(page), 
      limit: Number(limit), 
      search 
    });
    // Return just the array for compatibility with current frontend call
    res.json(result.users);
  } catch (error) {
    next(error);
  }
});

// GET /api/users/:id — admin only
router.get('/:id', adminAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user.toJSON());
  } catch (error) {
    next(error);
  }
});

module.exports = router;
