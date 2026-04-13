import { Router } from 'express';
import { query } from '../db.js';
import { authenticate, isAdmin } from '../auth.js';

const router = Router();

router.get('/:key', async (req, res) => {
  const { key } = req.params;
  
  // Only 'app' config is public. Others require admin access.
  if (key !== 'app') {
    return authenticate(req, res, () => {
      return isAdmin(req, res, async () => {
        try {
          const result = await query('SELECT value FROM config WHERE key = $1', [key]);
          if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Config not found' });
          }
          return res.json(result.rows[0].value);
        } catch (error) {
          return res.status(500).json({ error: 'Failed to load config', details: error });
        }
      });
    });
  }

  try {
    const result = await query('SELECT value FROM config WHERE key = $1', [key]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Config not found' });
    }
    return res.json(result.rows[0].value);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to load config', details: error });
  }
});

router.post('/:key', authenticate, isAdmin, async (req, res) => {
  const { key } = req.params;
  const value = req.body;
  try {
    const result = await query(
      'INSERT INTO config (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP RETURNING *',
      [key, JSON.stringify(value)]
    );
    return res.json(result.rows[0].value);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update config', details: error });
  }
});

export const configRoutes = router;
