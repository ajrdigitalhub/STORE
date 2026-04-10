import { Router } from 'express';
import { pool } from '../db.js';
import { authenticate, isAdmin } from '../auth.js';

const router = Router();

// Get all messages (Admin only)
router.get('/', authenticate, isAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM messages ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Submit a message (Public)
router.post('/', async (req, res) => {
  const { name, email, subject, message } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO messages (name, email, subject, message) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, email, subject, message]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error submitting message:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark message as read (Admin only)
router.put('/:id/read', authenticate, isAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('UPDATE messages SET is_read = true WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Message not found' });
      return;
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating message:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a message (Admin only)
router.delete('/:id', authenticate, isAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM messages WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Message not found' });
      return;
    }
    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
