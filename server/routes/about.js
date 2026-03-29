const express = require('express');
const About = require('../models/About');
const { adminAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/about - Public: Fetch About Us content
router.get('/', async (req, res, next) => {
  try {
    let about = await About.findOne();
    if (!about) {
      // Create default if not exists
      about = new About();
      await about.save();
    }
    res.json(about);
  } catch (error) {
    next(error);
  }
});

// PUT /api/about - Admin: Update About Us content
router.put('/', adminAuth, async (req, res, next) => {
  try {
    const { title, subtitle, description, mission, vision } = req.body;
    let about = await About.findOne();
    
    if (!about) {
      about = new About({ title, subtitle, description, mission, vision });
    } else {
      about.title = title || about.title;
      about.subtitle = subtitle || about.subtitle;
      about.description = description || about.description;
      about.mission = mission || about.mission;
      about.vision = vision || about.vision;
      about.lastUpdated = Date.now();
    }

    await about.save();
    res.json(about);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
