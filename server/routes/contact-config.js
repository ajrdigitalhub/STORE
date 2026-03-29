const express = require('express');
const ContactConfig = require('../models/ContactConfig');
const { adminAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/contact-config - Public: Fetch contact details
router.get('/', async (req, res, next) => {
  try {
    let config = await ContactConfig.findOne();
    if (!config) {
      config = new ContactConfig();
      await config.save();
    }
    res.json(config);
  } catch (error) {
    next(error);
  }
});

// PUT /api/contact-config - Admin: Update contact details
router.put('/', adminAuth, async (req, res, next) => {
  try {
    const { address, phone, email, workingHours } = req.body;
    let config = await ContactConfig.findOne();
    
    if (!config) {
      config = new ContactConfig({ address, phone, email, workingHours });
    } else {
      config.address = address || config.address;
      config.phone = phone || config.phone;
      config.email = email || config.email;
      config.workingHours = workingHours || config.workingHours;
      config.updatedAt = Date.now();
    }

    await config.save();
    res.json(config);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
