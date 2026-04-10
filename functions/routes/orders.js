import { Router } from 'express';
import { query } from '../db.js';
import { authenticate, isAdmin, optionalAuthenticate } from '../auth.js';

const router = Router();

router.get('/', authenticate, isAdmin, async (req, res) => {
  try {
    const result = await query('SELECT * FROM orders ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load orders', details: error });
  }
});

router.get('/customer/:uid', authenticate, async (req, res) => {
  const { uid } = req.params;
  const user = req.user;

  // Only allow user to see their own orders, or admin to see any
  if (user.uid !== uid && user.role !== 'admin' && user.email !== 'ajrgroupconnect@gmail.com') {
    res.status(403).json({ error: 'Unauthorized access to orders' });
    return;
  }

  try {
    const result = await query('SELECT * FROM orders WHERE customer_uid = $1 ORDER BY created_at DESC', [uid]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load customer orders', details: error });
  }
});

router.post('/', optionalAuthenticate, async (req, res) => {
  const { orderId, customerUid, total, status, paymentStatus, paymentMethod, shippingAddress, items } = req.body;
  const user = req.user;
  
  // Use user.uid if authenticated, otherwise use provided customerUid or null
  const finalUid = user?.uid || (customerUid !== 'guest' ? customerUid : null) || null;

  try {
    const result = await query(
      'INSERT INTO orders (order_id, customer_uid, total, status, payment_status, payment_method, shipping_address, items) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [orderId, finalUid, total, status, paymentStatus, paymentMethod, JSON.stringify(shippingAddress), JSON.stringify(items)]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create order', details: error });
  }
});

router.patch('/:id/status', authenticate, isAdmin, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const result = await query('UPDATE orders SET status = $1 WHERE id = $2 RETURNING *', [status, id]);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update order status', details: error });
  }
});

export const orderRoutes = router;
