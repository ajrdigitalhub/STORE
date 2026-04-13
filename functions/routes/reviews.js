import { Router } from 'express';
import { pool } from '../db.js';
import { authenticate, optionalAuthenticate } from '../auth.js';

const router = Router();

// Get reviews for a product
router.get('/product/:productId', async (req, res) => {
  const { productId } = req.params;
  try {
    const result = await pool.query(
      `SELECT r.*, u.display_name as user_name, u.avatar_url 
       FROM reviews r 
       LEFT JOIN users u ON r.user_uid = u.uid 
       WHERE r.product_id = $1 
       ORDER BY r.created_at DESC`,
      [productId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a review
router.post('/', authenticate, async (req, res) => {
  const { product_id, rating, comment } = req.body;
  const user_uid = req.user.uid;

  if (!product_id || !rating) {
    res.status(400).json({ error: 'Product ID and rating are required' });
    return;
  }

  try {
    const result = await pool.query(
      'INSERT INTO reviews (product_id, user_uid, rating, comment) VALUES ($1, $2, $3, $4) RETURNING *',
      [product_id, user_uid, rating, comment]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a review (Owner or Admin)
router.delete('/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  const user_uid = req.user.uid;
  const isAdmin = req.user.role === 'admin' || req.user.email === 'ajrgroupconnect@gmail.com';

  try {
    // Check ownership if not admin
    if (!isAdmin) {
      const checkResult = await pool.query('SELECT user_uid FROM reviews WHERE id = $1', [id]);
      if (checkResult.rows.length === 0) {
        res.status(404).json({ error: 'Review not found' });
        return;
      }
      if (checkResult.rows[0].user_uid !== user_uid) {
        res.status(403).json({ error: 'Unauthorized to delete this review' });
        return;
      }
    }

    const result = await pool.query('DELETE FROM reviews WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Review not found' });
      return;
    }
    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
