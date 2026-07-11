const express = require('express');
const crypto = require('crypto');
const pool = require('../db');
const Order = require('../models/Order');
const { auth, adminAuth, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// POST /api/orders — create order (customer or guest)
router.post('/', optionalAuth, async (req, res, next) => {
  try {
    const { 
      items, 
      shippingAddress, 
      shipping_address,
      paymentMethod, 
      payment_method,
      totalAmount,
      total_amount,
      gst_amount,
      shipping_charge,
      razorpay_orderid,
      razorpay_paymentid,
      razorpay_signature,
      isGuest,
      is_guest,
      guestName,
      guest_name,
      guestPhone,
      guest_phone,
      guestEmail,
      guest_email,
      firebaseUid,
      firebase_uid
    } = req.body;

    const finalShippingAddress = shippingAddress || shipping_address;
    const finalPaymentMethod = paymentMethod || payment_method;
    const finalTotalAmount = totalAmount !== undefined ? totalAmount : total_amount;
    const finalIsGuest = isGuest !== undefined ? isGuest : is_guest;
    const finalGuestName = guestName || guest_name;
    const finalGuestPhone = guestPhone || guest_phone;
    const finalGuestEmail = guestEmail || guest_email;
    const finalFirebaseUid = firebaseUid || firebase_uid;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Order must have at least one item' });
    }

    let paymentStatus = 'pending';
    let orderStatus = 'pending';

    // If Razorpay, verify payment before creating order
    if (finalPaymentMethod === 'razorpay') {
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
      user_id: req.userId || null,
      items,
      total_amount: finalTotalAmount,
      shipping_address: finalShippingAddress,
      payment_method: finalPaymentMethod,
      payment_status: paymentStatus,
      order_status: orderStatus,
      gst_amount,
      shipping_charge,
      razorpay_orderid,
      razorpay_paymentid,
      razorpay_signature,
      is_guest: finalIsGuest === 'true' || finalIsGuest === true || !req.userId,
      guest_name: finalGuestName,
      guest_phone: finalGuestPhone,
      guest_email: finalGuestEmail,
      firebase_uid: finalFirebaseUid
    });

    // Log conversion event
    try {
      const eventType = (!req.userId) ? 'checkout_complete_guest' : 'checkout_complete_registered';
      await pool.query('INSERT INTO conversion_events (event_type, amount) VALUES ($1, $2)', [eventType, finalTotalAmount]);
    } catch (err) {
      console.error('Failed to log conversion event:', err);
    }

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
    const { page = 1, limit = 10, isGuest } = req.query;

    let result;
    if (req.user.role === 'admin') {
      result = await Order.findAll({ page: Number(page), limit: Number(limit), isGuest });
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

// GET /api/orders/track — public track order
router.get('/track', async (req, res, next) => {
  try {
    const { orderNumber, phone } = req.query;
    if (!orderNumber || !phone) {
      return res.status(400).json({ message: 'Order number and mobile number are required' });
    }

    const order = await Order.findByOrderNumber(orderNumber);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Verify phone matches shipping address phone (compare last 10 digits to prevent country code mismatches)
    const savedPhone = (order.shipping_address?.phone || order.phone || '').replace(/\D/g, '').slice(-10);
    const inputPhone = phone.replace(/\D/g, '').slice(-10);

    if (savedPhone !== inputPhone) {
      return res.status(403).json({ message: 'Access denied. Information mismatch.' });
    }

    res.json(order);
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
    const { orderStatus, paymentStatus, courierName, trackingNumber } = req.body;
    const order = await Order.updateStatus(req.params.id, { orderStatus, paymentStatus, courierName, trackingNumber });
    
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
