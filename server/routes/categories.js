const express = require('express');
const Category = require('../models/Category');
const { adminAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/categories
router.get('/', async (req, res, next) => {
  try {
    const categories = await Category.find({ active: true }).sort('name');
    res.json(categories);
  } catch (error) {
    next(error);
  }
});

// GET /api/categories/:id
router.get('/:id', async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });
    res.json(category);
  } catch (error) {
    next(error);
  }
});

// POST /api/categories — admin only
router.post('/', adminAuth, async (req, res, next) => {
  try {
    const { name, description, image } = req.body;
    const category = new Category({ name, description, image });
    await category.save();
    res.status(201).json(category);
  } catch (error) {
    next(error);
  }
});

// PUT /api/categories/:id — admin only
router.put('/:id', adminAuth, async (req, res, next) => {
  try {
    const { name, description, image, active } = req.body;
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { name, description, image, active },
      { new: true, runValidators: true }
    );
    if (!category) return res.status(404).json({ message: 'Category not found' });
    res.json(category);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/categories/:id — admin only
router.delete('/:id', adminAuth, async (req, res, next) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
