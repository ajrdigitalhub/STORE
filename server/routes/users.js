import { Router } from 'express';
import { pool } from '../db.js';
import { authenticate, isAdmin } from '../auth.js';

const router = Router();

// Get all customers (Admin only)
router.get('/', authenticate, isAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, uid, email, display_name, role, avatar_url, phone, address, created_at FROM users WHERE role = $1 ORDER BY created_at DESC', ['customer']);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user profile
router.get('/profile', authenticate, async (req, res) => {
  const uid = req.user?.uid;
  if (!uid) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  try {
    const result = await pool.query('SELECT id, uid, email, display_name, role, avatar_url, phone, address, created_at FROM users WHERE uid = $1', [uid]);
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update current user profile
router.put('/profile', authenticate, async (req, res) => {
  const uid = req.user?.uid;
  if (!uid) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const { display_name, avatar_url, phone, address } = req.body;
  try {
    const result = await pool.query(
      'UPDATE users SET display_name = $1, avatar_url = $2, phone = $3, address = $4 WHERE uid = $5 RETURNING id, uid, email, display_name, role, avatar_url, phone, address, created_at',
      [display_name, avatar_url, phone, JSON.stringify(address), uid]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
