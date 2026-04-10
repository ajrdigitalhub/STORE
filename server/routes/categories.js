import { Router } from 'express';
import { pool } from '../db.js';
import { authenticate, isAdmin } from '../auth.js';

const router = Router();

// Get all categories
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categories ORDER BY name ASC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a category (Admin only)
router.post('/', authenticate, isAdmin, async (req, res) => {
  const { name, slug, description, image_url } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO categories (name, slug, description, image_url) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, slug, description, image_url]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update a category (Admin only)
router.put('/:id', authenticate, isAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, slug, description, image_url } = req.body;
  try {
    const result = await pool.query(
      'UPDATE categories SET name = $1, slug = $2, description = $3, image_url = $4 WHERE id = $5 RETURNING *',
      [name, slug, description, image_url, id]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a category (Admin only)
router.delete('/:id', authenticate, isAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM categories WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
