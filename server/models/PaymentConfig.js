const mongoose = require('mongoose');

const paymentConfigSchema = new mongoose.Schema({
  razorpayKeyId: { type: String, required: true },
  razorpayKeySecret: { type: String, required: true },
  merchantName: { type: String, default: 'IDEAZONE3D' },
  merchantLogo: { type: String, default: '' },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('PaymentConfig', paymentConfigSchema);
