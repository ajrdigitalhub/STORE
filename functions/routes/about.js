const express = require('express');
const About = require('../models/About');
const { adminAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/about - Public: Fetch About Us content
router.get('/', async (req, res, next) => {
  try {
    const about = await About.get();
    res.json(about);
  } catch (error) {
    next(error);
  }
});

// PUT /api/about - Admin: Update About Us content
router.put('/', adminAuth, async (req, res, next) => {
  try {
    const { title, subtitle, description, mission, vision } = req.body;
    const about = await About.update({ title, subtitle, description, mission, vision });
    res.json(about);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
