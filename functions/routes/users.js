const express = require('express');
const User = require('../models/User');
const { adminAuth } = require('../middleware/auth');
const pool = require('../db');

const router = express.Router();

// GET /api/users — admin only
router.get('/', adminAuth, async (req, res, next) => {
  try {
    const { page = 1, limit = 100, search = '', tutorial_ids } = req.query;
    let tutorialIds = null;
    if (tutorial_ids) {
      tutorialIds = String(tutorial_ids).split(',').map(Number).filter(id => !isNaN(id));
    }
    const result = await User.findAll({ 
      page: Number(page), 
      limit: Number(limit), 
      search,
      tutorialIds
    });
    // Return just the array for compatibility with current frontend call
    res.json(result.users);
  } catch (error) {
    next(error);
  }
});

// GET /api/users/:id — admin only
router.get('/:id', adminAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user.toJSON());
  } catch (error) {
    next(error);
  }
});

// PUT /api/users/:id — admin only (update full customer data + explicit tutorials)
router.put('/:id', adminAuth, async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { name, email, role, phone, address, tutorial_access, tutorial_ids } = req.body;
    
    const user = await User.update(req.params.id, {
      name, email, role, phone, address, tutorial_access
    });
    
    if (!user) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'User not found' });
    }

    if (Array.isArray(tutorial_ids)) {
      // Clear existing explicit mappings
      await client.query('DELETE FROM user_tutorial_access WHERE user_id = $1', [req.params.id]);
      // Insert new explicit mappings
      for (const tutId of tutorial_ids) {
        await client.query(
          'INSERT INTO user_tutorial_access (user_id, tutorial_id) VALUES ($1, $2)',
          [req.params.id, tutId]
        );
      }
    }

    await client.query('COMMIT');
    res.json(user.toJSON());
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
});

// PUT /api/users/:id/tutorial-access — admin only
router.put('/:id/tutorial-access', adminAuth, async (req, res, next) => {
  try {
    const { tutorial_access } = req.body;
    const user = await User.update(req.params.id, { tutorial_access });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user.toJSON());
  } catch (error) {
    next(error);
  }
});

module.exports = router;
