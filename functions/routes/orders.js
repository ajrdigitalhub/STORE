const express = require('express');
const Order = require('../models/Order');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// POST /api/orders — create order (customer)
router.post('/', auth, async (req, res, next) => {
  try {
    const { items, shippingAddress, paymentMethod, totalAmount } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Order must have at least one item' });
    }

    const order = await Order.create({
      user_id: req.userId,
      items,
      total_amount: totalAmount,
      shipping_address: shippingAddress,
      payment_method: paymentMethod
    });

    res.status(201).json(order);
  } catch (error) {
    next(error);
  }
});

// GET /api/orders — customer's orders or all orders for admin
router.get('/', auth, async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    let result;
    if (req.user.role === 'admin') {
      result = await Order.findAll({ page: Number(page), limit: Number(limit) });
    } else {
      result = await Order.findByUser(req.userId, { page: Number(page), limit: Number(limit) });
    }

    res.json({ 
      orders: result.orders, 
      total: result.total, 
      page: Number(page), 
      pages: Math.ceil(result.total / Number(limit)) 
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/orders/:id
router.get('/:id', auth, async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Customer can only see own orders
    if (req.user.role !== 'admin' && order.user_id !== req.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(order);
  } catch (error) {
    next(error);
  }
});

// PUT /api/orders/:id/status — admin update order status
router.put('/:id/status', adminAuth, async (req, res, next) => {
  try {
    const { orderStatus, paymentStatus } = req.body;
    const order = await Order.updateStatus(req.params.id, { orderStatus, paymentStatus });
    res.json(order);
  } catch (error) {
    next(error);
  }
});

// GET /api/orders/admin/stats — admin dashboard stats
router.get('/admin/stats', adminAuth, async (req, res, next) => {
  try {
    const stats = await Order.getStats();
    const recentOrders = await Order.getRecent(5);

    res.json({
      totalOrders: stats.total_orders,
      pendingOrders: stats.pending_orders,
      totalRevenue: stats.total_revenue,
      recentOrders
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
