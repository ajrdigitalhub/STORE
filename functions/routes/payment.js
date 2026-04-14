const express = require('express');
const crypto = require('crypto');
const Razorpay = require('razorpay');
const pool = require('../db');
const Order = require('../models/Order');
const PaymentConfig = require('../models/PaymentConfig');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Initialize Razorpay helper
const getRazorpayInstance = async () => {
  try {
    // Read from 'config' table like the Admin Dashboard does
    const appConfigResult = await pool.query('SELECT value FROM config WHERE key = $1', ['app']);
    const secretConfigResult = await pool.query('SELECT value FROM config WHERE key = $1', ['razorpay_secret']);
    
    const appConfig = appConfigResult.rows.length > 0 ? appConfigResult.rows[0].value : {};
    const secretConfig = secretConfigResult.rows.length > 0 ? secretConfigResult.rows[0].value : {};

    const key_id_source = appConfig.razorpay?.keyId ? 'DB (app)' : (process.env.RAZORPAY_KEY_ID ? 'Env' : 'None');
    const key_secret_source = secretConfig.keySecret ? 'DB (razorpay_secret)' : (process.env.RAZORPAY_KEY_SECRET ? 'Env' : 'None');

    const key_id = (appConfig.razorpay?.keyId || process.env.RAZORPAY_KEY_ID || '').trim();
    const key_secret = (secretConfig.keySecret || process.env.RAZORPAY_KEY_SECRET || '').trim();

    console.log('Razorpay Initialization Attempt:', { 
      has_key_id: !!key_id, 
      key_id_source,
      key_id_length: key_id.length,
      has_key_secret: !!key_secret,
      key_secret_source
    });

    if (!key_id || !key_secret) {
      throw new Error('Razorpay credentials are missing or empty. Please configure them in the Admin Panel (Payment Settings) or environment variables.');
    }

    const instance = new Razorpay({
      key_id: key_id,
      key_secret: key_secret
    });
    
    return {
      instance,
      key_id,
      key_secret
    };
  } catch (err) {
    console.error('Razorpay Initialization Error:', err);
    throw err;
  }
};

// GET /api/payment/get-key
router.get('/get-key', auth, async (req, res, next) => {
  try {
    const { key_id } = await getRazorpayInstance();
    res.json({ key: key_id });
  } catch (error) {
    next(error);
  }
});

// POST /api/payment/create-order
router.post('/create-order', auth, async (req, res, next) => {
  try {
    const { amount } = req.body;

    const { instance: razorpay, key_id } = await getRazorpayInstance();
    const options = {
      amount: Math.round(amount * 100),
      currency: 'INR',
      receipt: `rcpt_${Date.now()}`
    };

    const razorpayOrder = await razorpay.orders.create(options);

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
