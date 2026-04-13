import { Router } from 'express';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { serverConfig } from '../config.js';
import { query } from '../db.js';
import { authenticate, isAdmin } from '../auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = Router();

router.get('/', async (req, res) => {
  if (serverConfig.useMockData) {
    try {
      const staticDataPath = join(__dirname, '../../public/static.json');
      const data = JSON.parse(readFileSync(staticDataPath, 'utf-8'));
      res.json(data.products);
    } catch (error) {
      res.status(500).json({ error: 'Failed to load mock data', details: error });
    }
  } else {
    try {
      const result = await query(`
        SELECT p.*, c.name as category_name 
        FROM products p 
        LEFT JOIN categories c ON p.category_id = c.id 
        ORDER BY p.created_at DESC
      `);
      res.json(result.rows);
    } catch (error) {
      res.status(500).json({ error: 'Failed to load products from database', details: error });
    }
  }
});

router.post('/', authenticate, isAdmin, async (req, res) => {
  const { name, description, price, category_id, images, stock, is_featured } = req.body;
  try {
    const result = await query(
      'INSERT INTO products (name, description, price, category_id, images, stock, is_featured) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [name, description, price, category_id, images, stock, is_featured]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create product', details: error });
  }
});

router.patch('/:id', authenticate, isAdmin, async (req, res) => {
  const { id } = req.params;
  const fields = req.body;
  const keys = Object.keys(fields);
  if (keys.length === 0) {
    res.status(400).json({ error: 'No fields to update' });
    return;
  }

  const setClause = keys.map((key, index) => `${key} = $${index + 1}`).join(', ');
  const values = Object.values(fields);

  try {
    const result = await query(
      `UPDATE products SET ${setClause} WHERE id = $${keys.length + 1} RETURNING *`,
      [...values, id]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update product', details: error });
  }
});

router.delete('/:id', authenticate, isAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await query('DELETE FROM products WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete product', details: error });
  }
});

export const productRoutes = router;
