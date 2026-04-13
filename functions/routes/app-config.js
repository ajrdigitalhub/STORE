const express = require('express');
const Config = require('../models/Config');
const { adminAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/app-config/:key
router.get('/:key', async (req, res, next) => {
  try {
    const config = await Config.get(req.params.key);
    if (!config) return res.status(404).json({ message: 'Config not found' });
    res.json(config);
  } catch (error) {
    next(error);
  }
});

// POST /api/app-config/:key — admin only
router.post('/:key', adminAuth, async (req, res, next) => {
  try {
    const config = await Config.set(req.params.key, req.body);
    res.json(config);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
