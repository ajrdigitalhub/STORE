const express = require('express');
const PaymentConfig = require('../models/PaymentConfig');
const { adminAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/payment-config - Get public config (keys without secret, name, logo)
router.get('/public', async (req, res, next) => {
  try {
    let config = await PaymentConfig.findOne();
    if (!config) {
      // Fallback to env if nothing in DB
      return res.json({
        razorpayKeyId: process.env.RAZORPAY_KEY_ID,
        merchantName: 'IDEAZONE3D',
        merchantLogo: ''
      });
    }
    res.json({
      razorpayKeyId: config.razorpayKeyId,
      merchantName: config.merchantName,
      merchantLogo: config.merchantLogo
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/payment-config/admin - Get full config (admin only)
router.get('/admin', adminAuth, async (req, res, next) => {
  try {
    let config = await PaymentConfig.findOne();
    if (!config) {
      return res.json({
        razorpayKeyId: process.env.RAZORPAY_KEY_ID,
        razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET,
        merchantName: 'IDEAZONE3D',
        merchantLogo: ''
      });
    }
    res.json(config);
  } catch (error) {
    next(error);
  }
});

// POST /api/payment-config - Update config (admin only)
router.post('/', adminAuth, async (req, res, next) => {
  try {
    const { razorpayKeyId, razorpayKeySecret, merchantName, merchantLogo } = req.body;
    let config = await PaymentConfig.findOne();

    if (config) {
      config.razorpayKeyId = razorpayKeyId;
      config.razorpayKeySecret = razorpayKeySecret;
      config.merchantName = merchantName;
      config.merchantLogo = merchantLogo;
      config.updatedAt = Date.now();
    } else {
      config = new PaymentConfig({
        razorpayKeyId,
        razorpayKeySecret,
        merchantName,
        merchantLogo
      });
    }

    await config.save();
    res.json(config);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
