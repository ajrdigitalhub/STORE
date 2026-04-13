const express = require('express');
const crypto = require('crypto');
const Razorpay = require('razorpay');
const Order = require('../models/Order');
const PaymentConfig = require('../models/PaymentConfig');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Initialize Razorpay helper
const getRazorpayInstance = async () => {
  const config = await PaymentConfig.get();
  return {
    instance: new Razorpay({
      key_id: config.razorpay_keyid || process.env.RAZORPAY_KEY_ID,
      key_secret: config.razorpay_key_secret || process.env.RAZORPAY_KEY_SECRET
    }),
    key_id: config.razorpay_keyid || process.env.RAZORPAY_KEY_ID,
    key_secret: config.razorpay_key_secret || process.env.RAZORPAY_KEY_SECRET
  };
};

// POST /api/payment/create-order
router.post('/create-order', auth, async (req, res, next) => {
  try {
    const { amount, orderId } = req.body;

    const { instance: razorpay, key_id } = await getRazorpayInstance();
    const options = {
      amount: Math.round(amount * 100),
      currency: 'INR',
      receipt: orderId.toString()
    };

    const razorpayOrder = await razorpay.orders.create(options);
    await Order.updatePayment(orderId, { razorpayOrderId: razorpayOrder.id });

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
    const { razorpay_orderid, razorpay_paymentid, razorpay_signature, orderId } = req.body;
    const { key_secret } = await getRazorpayInstance();

    const body = razorpay_orderid + '|' + razorpay_paymentid;
    const expectedSignature = crypto
      .createHmac('sha256', key_secret)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      await Order.updatePayment(orderId, { paymentStatus: 'failed' });
      return res.status(400).json({ message: 'Payment verification failed' });
    }

    const order = await Order.updatePayment(orderId, {
      razorpayPaymentId: razorpay_paymentid,
      razorpaySignature: razorpay_signature,
      paymentStatus: 'paid'
    });

    await Order.updateStatus(orderId, { orderStatus: 'processing' });
    res.json({ message: 'Payment verified successfully', order });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
