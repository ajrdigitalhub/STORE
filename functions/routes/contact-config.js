const express = require('express');
const ContactConfig = require('../models/ContactConfig');
const { adminAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const config = await ContactConfig.get();
    res.json(config);
  } catch (error) {
    next(error);
  }
});

router.put('/', adminAuth, async (req, res, next) => {
  try {
    const config = await ContactConfig.update(req.body);
    res.json(config);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
