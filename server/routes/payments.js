import { Router } from 'express';
import Razorpay from 'razorpay';
import { authenticate, optionalAuthenticate } from '../auth.js';
import { query } from '../db.js';

const router = Router();

async function getRazorpayConfig() {
  try {
    const appConfigRes = await query('SELECT value FROM config WHERE key = $1', ['app']);
    const secretConfigRes = await query('SELECT value FROM config WHERE key = $1', ['razorpay_secret']);
    
    const appConfig = appConfigRes.rows[0]?.value || {};
    const secretConfig = secretConfigRes.rows[0]?.value || {};
    
    const key_id = appConfig.razorpay?.keyId || process.env['RAZORPAY_KEY_ID'];
    const key_secret = secretConfig.keySecret || process.env['RAZORPAY_KEY_SECRET'];
    const enabled = appConfig.razorpay?.enabled ?? true;

    return { key_id, key_secret, enabled };
  } catch (error) {
    console.error('Failed to fetch Razorpay config from DB', error);
    return {
      key_id: process.env['RAZORPAY_KEY_ID'],
      key_secret: process.env['RAZORPAY_KEY_SECRET'],
      enabled: true
    };
  }
}

let razorpayInstance = null;
let lastKeyId = null;

async function getRazorpay() {
  const { key_id, key_secret, enabled } = await getRazorpayConfig();
  
  if (!enabled) {
    throw new Error('Razorpay payment gateway is currently disabled');
  }

  if (!key_id || !key_secret) {
    throw new Error('Razorpay keys are not configured');
  }

  if (!razorpayInstance || lastKeyId !== key_id) {
    razorpayInstance = new Razorpay({
      key_id,
      key_secret,
    });
    lastKeyId = key_id;
  }
  return razorpayInstance;
}

router.get('/get-key', async (req, res) => {
  const { key_id } = await getRazorpayConfig();
  return res.json({ key: key_id || '' });
});

router.post('/create-order', optionalAuthenticate, async (req, res) => {
  const { amount, currency = 'INR' } = req.body;

  try {
    const razorpay = await getRazorpay();
    const options = {
      amount: Math.round(amount * 100), // amount in the smallest currency unit
      currency,
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    return res.json(order);
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to create payment order' });
  }
});

router.post('/verify', optionalAuthenticate, async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  
  try {
    const { key_secret } = await getRazorpayConfig();
    const crypto = await import('node:crypto');
    const hmac = crypto.createHmac('sha256', key_secret || '');

    hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
    const generated_signature = hmac.digest('hex');

    if (generated_signature === razorpay_signature) {
      return res.json({ status: 'success' });
    } else {
      return res.status(400).json({ status: 'failure' });
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    return res.status(500).json({ error: 'Verification failed' });
  }
});

export const paymentRoutes = router;
