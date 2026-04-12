const express = require('express');
const User = require('../models/User');
const Order = require('../models/Order');
const { adminAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/users — admin only, list all customers
router.get('/', adminAuth, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search } = req.query;

    const result = await User.findAll({ page: Number(page), limit: Number(limit), search });

    res.json({ users: result.users, total: result.total, page: Number(page), pages: Math.ceil(result.total / Number(limit)) });
  } catch (error) {
    next(error);
  }
});

// GET /api/users/count — admin: total customer count
router.get('/count', adminAuth, async (req, res, next) => {
  try {
    const count = await User.count();
    res.json({ count });
  } catch (error) {
    next(error);
  }
});

// GET /api/users/:id — admin only
router.get('/:id', adminAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const orders = await Order.findByUser(user.id, { limit: 10 });
    res.json({ user, orders: orders.orders });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
