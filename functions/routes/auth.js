const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/register
router.post('/register', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
    }

    const { name, email, password, phone, address } = req.body;

    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered.' });
    }

    const user = await User.create({ name, email, password, phone, address });

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: user.toJSON()
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/login
router.post('/login', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
    }

    const { email, password } = req.body;

    let user = await User.findByEmail(email);

    // Auto-seed admin user if trying to login with admin@ideazone.com and it doesn't exist
    if (!user && email === 'admin@ideazone.com') {
      user = await User.create({
        name: 'Admin',
        email: 'admin@ideazone.com',
        password: 'admin123',
      });
      // Update role to admin
      const pool = require('../db');
      await pool.query('UPDATE users SET role = $1 WHERE email = $2', ['admin', 'admin@ideazone.com']);
      user.role = 'admin';
    }

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: user.toJSON()
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/auth/profile
router.get('/profile', auth, async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user: user.toJSON() });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/google-sync
router.post('/google-sync', async (req, res, next) => {
  try {
    const { email, name, uid } = req.body;

    let user = await User.findByEmail(email);
    if (!user) {
      // Create user if not exists
      // Generate a random password for Google users
      const randomPass = Math.random().toString(36).slice(-10);
      const finalName = name || email.split('@')[0] || 'User';
      user = await User.create({ name: finalName, email, password: randomPass });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: user.toJSON()
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
