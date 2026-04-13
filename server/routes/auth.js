import { Router } from 'express';
import { query } from '../db.js';

const router = Router();

router.post('/register', async (req, res) => {
  const { email, displayName, uid } = req.body;
  try {
    const result = await query(
      'INSERT INTO users (email, display_name, uid) VALUES ($1, $2, $3) ON CONFLICT (uid) DO UPDATE SET email = $1, display_name = $2 RETURNING id, email, display_name, uid, role',
      [email, displayName, uid]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to register user', details: error });
  }
});

router.get('/profile/:uid', async (req, res) => {
  const { uid } = req.params;
  try {
    const result = await query('SELECT id, email, display_name, uid, role, created_at FROM users WHERE uid = $1', [uid]);
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profile', details: error });
  }
});

export const authRoutes = router;
