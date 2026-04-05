const express = require('express');
const ContactConfig = require('../models/ContactConfig');
const { adminAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/contact-config - Public: Fetch contact details
router.get('/', async (req, res, next) => {
  try {
    const config = await ContactConfig.get();
    res.json(config);
  } catch (error) {
    next(error);
  }
});

// PUT /api/contact-config - Admin: Update contact details
router.put('/', adminAuth, async (req, res, next) => {
  try {
    const { address, phone, email, workingHours } = req.body;
    const config = await ContactConfig.update({ address, phone, email, working_hours: workingHours });
    res.json(config);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
