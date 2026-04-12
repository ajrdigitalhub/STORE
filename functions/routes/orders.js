const express = require('express');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { auth, adminAuth } = require('../middleware/auth');
const { getIO } = require('../socket/chat');

const router = express.Router();

// POST /api/orders — create order (customer)
router.post('/', auth, async (req, res, next) => {
  try {
    const { items, shippingAddress, paymentMethod, totalAmount } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Order must have at least one item' });
    }

    const order = await Order.create({
      userid: req.userId,
      items,
      total_amount: totalAmount,
      shipping_address: shippingAddress,
      payment_method: paymentMethod
    });

    // Emit to admin
    const io = getIO();
    if (io) {
      io.to('admin-room').emit('admin:orderUpdate', {
        type: 'new',
        order
      });
    }

    res.status(201).json(order);
  } catch (error) {
    next(error);
  }
});

// GET /api/orders — customer's orders
router.get('/', auth, async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    let orders, total;
    if (req.user.role === 'admin') {
      const result = await Order.findAll({ page: Number(page), limit: Number(limit) });
      orders = result.orders;
      total = result.total;
    } else {
      const result = await Order.findByUser(req.userId, { page: Number(page), limit: Number(limit) });
      orders = result.orders;
      total = result.total;
    }

    res.json({ orders, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
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
    if (req.user.role !== 'admin' && order.userid !== req.userId) {
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
    const { orderStatus } = req.body;
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

    if (!validStatuses.includes(orderStatus)) {
      return res.status(400).json({ message: 'Invalid order status' });
    }

    const order = await Order.updateStatus(req.params.id, { orderStatus });

    // Emit to customer and admin
    const io = getIO();
    if (io) {
      // To customer
      io.to(order.userid.toString()).emit('customer:orderUpdate', {
        type: 'status',
        orderId: order.id,
        status: orderStatus,
        order
      });
      // To admin (to update their list/dashboard)
      io.to('admin-room').emit('admin:orderUpdate', {
        type: 'status',
        orderId: order.id,
        status: orderStatus,
        order
      });
    }

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
