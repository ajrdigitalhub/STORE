const express = require('express');
const crypto = require('crypto');
const Razorpay = require('razorpay');
const Order = require('../models/Order');
const PaymentConfig = require('../models/PaymentConfig');
const { auth } = require('../middleware/auth');
const { getIO } = require('../socket/chat');

const router = express.Router();

// Initialize Razorpay helper
const getRazorpayInstance = async () => {
  const config = await PaymentConfig.get();
  if (config && config.razorpay_keyid && config.razorpay_key_secret) {
    return {
      instance: new Razorpay({
        keyid: config.razorpay_keyid,
        key_secret: config.razorpay_key_secret
      }),
      keyid: config.razorpay_keyid,
      key_secret: config.razorpay_key_secret
    };
  }
  return {
    instance: new Razorpay({
      keyid: process.env.RAZORPAY_KEYid,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    }),
    keyid: process.env.RAZORPAY_KEYid,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  };
};

// POST /api/payment/create-order
router.post('/create-order', auth, async (req, res, next) => {
  try {
    const { amount, orderId } = req.body;

    if (!amount || !orderId) {
      return res.status(400).json({ message: 'Amount and orderId are required' });
    }

    const { instance: razorpay, keyid } = await getRazorpayInstance();
    const options = {
      amount: Math.round(amount * 100), // Amount in paise
      currency: 'INR',
      receipt: orderId,
      notes: { orderId }
    };

    const razorpayOrder = await razorpay.orders.create(options);

    // Update order with razorpay order id
    await Order.updatePayment(orderId, { razorpayOrderId: razorpayOrder.id });

    res.json({
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key: keyid
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/payment/verify
router.post('/verify', auth, async (req, res, next) => {
  try {
    const { razorpay_orderid, razorpay_paymentid, razorpay_signature, orderId } = req.body;

    const { key_secret } = await getRazorpayInstance();

    // Verify signature
    const body = razorpay_orderid + '|' + razorpay_paymentid;
    const expectedSignature = crypto
      .createHmac('sha256', key_secret)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      await Order.updatePayment(orderId, { paymentStatus: 'failed' });
      return res.status(400).json({ message: 'Payment verification failed' });
    }

    // Update order as paid
    const order = await Order.updatePayment(orderId, {
      razorpayPaymentId: razorpay_paymentid,
      razorpaySignature: razorpay_signature,
      paymentStatus: 'paid'
    });

    // Update order status to processing
    await Order.updateStatus(orderId, { orderStatus: 'processing' });

    // Emit to admin
    const io = getIO();
    if (io) {
      io.to('admin-room').emit('admin:orderUpdate', {
        type: 'payment',
        order
      });
    }

    res.json({ message: 'Payment verified successfully', order });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
