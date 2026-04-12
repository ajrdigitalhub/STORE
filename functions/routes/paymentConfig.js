const express = require('express');
const PaymentConfig = require('../models/PaymentConfig');
const { adminAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/public', async (req, res, next) => {
  try {
    const config = await PaymentConfig.get();
    res.json({
      razorpayKeyId: config.razorpay_keyid,
      merchantName: config.merchant_name,
      merchantLogo: config.merchant_logo
    });
  } catch (error) {
    next(error);
  }
});

router.get('/admin', adminAuth, async (req, res, next) => {
  try {
    const config = await PaymentConfig.get();
    res.json(config);
  } catch (error) {
    next(error);
  }
});

router.post('/', adminAuth, async (req, res, next) => {
  try {
    const config = await PaymentConfig.update(req.body);
    res.json(config);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
