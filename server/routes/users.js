const express = require('express');
const User = require('../models/User');
const Order = require('../models/Order');
const { adminAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/users — admin only, list all customers
router.get('/', adminAuth, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const filter = { role: 'customer' };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter).sort('-createdAt').skip(skip).limit(Number(limit)),
      User.countDocuments(filter)
    ]);

    res.json({ users, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (error) {
    next(error);
  }
});

// GET /api/users/count — admin: total customer count
router.get('/count', adminAuth, async (req, res, next) => {
  try {
    const count = await User.countDocuments({ role: 'customer' });
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

    const orders = await Order.find({ user: user._id }).sort('-createdAt').limit(10);
    res.json({ user, orders });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
