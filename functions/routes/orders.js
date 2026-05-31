const express = require('express');
const crypto = require('crypto');
const pool = require('../db');
const Order = require('../models/Order');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// POST /api/orders — create order (customer)
router.post('/', auth, async (req, res, next) => {
  try {
    const { 
      items, 
      shippingAddress, 
      paymentMethod, 
      totalAmount,
      gst_amount,
      shipping_charge,
      razorpay_orderid,
      razorpay_paymentid,
      razorpay_signature
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Order must have at least one item' });
    }

    let paymentStatus = 'pending';
    let orderStatus = 'pending';

    // If Razorpay, verify payment before creating order
    if (paymentMethod === 'razorpay') {
      if (!razorpay_orderid || !razorpay_paymentid || !razorpay_signature) {
        return res.status(400).json({ message: 'Razorpay payment details are required' });
      }

      // Get Razorpay secret from DB
      const secretConfigResult = await pool.query('SELECT value FROM config WHERE key = $1', ['razorpay_secret']);
      const secretConfig = secretConfigResult.rows.length > 0 ? secretConfigResult.rows[0].value : {};
      const key_secret = (secretConfig.keySecret || process.env.RAZORPAY_KEY_SECRET || '').trim();

      if (!key_secret) {
        return res.status(500).json({ message: 'Razorpay secret not configured' });
      }

      const body = razorpay_orderid + '|' + razorpay_paymentid;
      const expectedSignature = crypto
        .createHmac('sha256', key_secret)
        .update(body.toString())
        .digest('hex');

      if (expectedSignature !== razorpay_signature) {
        return res.status(400).json({ message: 'Payment verification failed' });
      }

      paymentStatus = 'paid';
      orderStatus = 'processing';
    }

    const order = await Order.create({
      user_id: req.userId,
      items,
      total_amount: totalAmount,
      shipping_address: shippingAddress,
      payment_method: paymentMethod,
      payment_status: paymentStatus,
      order_status: orderStatus,
      gst_amount,
      shipping_charge,
      razorpay_orderid,
      razorpay_paymentid,
      razorpay_signature
    });

    // Send WhatsApp confirmation
    const { sendOrderConfirmation } = require('../whatsapp');
    // Fetch order with user details for notification
    const orderWithDetails = await Order.findById(order.id);
    sendOrderConfirmation({
      ...orderWithDetails,
      customerName: orderWithDetails.user_name,
      orderNumber: orderWithDetails.order_number,
      totalAmount: orderWithDetails.total_amount,
      paymentMethod: orderWithDetails.payment_method,
      status: orderWithDetails.order_status,
      paymentId: orderWithDetails.razorpay_paymentid,
      orderDate: orderWithDetails.created_at,
      shippingAddress: orderWithDetails.shipping_address,
      userId: orderWithDetails.user_id
    }).catch(err => console.error('WhatsApp notification failed:', err));

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
    
    // Send WhatsApp notification
    const { sendOrderStatusUpdate } = require('../whatsapp');
    const orderWithDetails = await Order.findById(req.params.id);
    
    if (orderWithDetails) {
      sendOrderStatusUpdate({
        ...orderWithDetails,
        whatsappNumber: orderWithDetails.whatsappNumber || orderWithDetails.shippingAddress?.whatsappNumber,
        customerName: orderWithDetails.user_name,
        orderNumber: orderWithDetails.order_number,
        totalAmount: orderWithDetails.total_amount,
        paymentMethod: orderWithDetails.payment_method,
        status: orderWithDetails.order_status,
        shippingAddress: typeof orderWithDetails.shipping_address === 'string' ? JSON.parse(orderWithDetails.shipping_address) : orderWithDetails.shipping_address,
        userId: orderWithDetails.user_id
      }, orderStatus).catch(err => console.error('WhatsApp status update notification failed:', err));
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
