const express = require('express');
const crypto = require('crypto');
const Razorpay = require('razorpay');
const Order = require('../models/Order');
const PaymentConfig = require('../models/PaymentConfig');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Initialize Razorpay helper
const getRazorpayInstance = async () => {
  const config = await PaymentConfig.findOne();
  if (config && config.razorpayKeyId && config.razorpayKeySecret) {
    return {
      instance: new Razorpay({
        key_id: config.razorpayKeyId,
        key_secret: config.razorpayKeySecret
      }),
      key_id: config.razorpayKeyId,
      key_secret: config.razorpayKeySecret
    };
  }
  return {
    instance: new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    }),
    key_id: process.env.RAZORPAY_KEY_ID,
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

    const { instance: razorpay, key_id } = await getRazorpayInstance();
    const options = {
      amount: Math.round(amount * 100), // Amount in paise
      currency: 'INR',
      receipt: orderId,
      notes: { orderId }
    };

    const razorpayOrder = await razorpay.orders.create(options);

    // Update order with razorpay order id
    await Order.findByIdAndUpdate(orderId, {
      razorpayOrderId: razorpayOrder.id
    });

    res.json({
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key: key_id
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/payment/verify
router.post('/verify', auth, async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

    const { key_secret } = await getRazorpayInstance();

    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', key_secret)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      await Order.findByIdAndUpdate(orderId, { paymentStatus: 'failed' });
      return res.status(400).json({ message: 'Payment verification failed' });
    }

    // Update order as paid
    const order = await Order.findByIdAndUpdate(orderId, {
      paymentStatus: 'paid',
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      orderStatus: 'processing'
    }, { new: true });

    res.json({ message: 'Payment verified successfully', order });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
