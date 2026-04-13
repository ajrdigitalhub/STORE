const express = require('express');
const Product = require('../models/Product');
const { adminAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/products — list with search, filter, pagination
router.get('/', async (req, res, next) => {
  try {
    const { search, category, minPrice, maxPrice, featured, page = 1, limit = 12, sort = 'created_at', order = 'desc' } = req.query;
    const featuredFilter = typeof featured === 'string' ? featured === 'true' : undefined;

    const result = await Product.findAll({
      search,
      category,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      featured: featuredFilter,
      page: Number(page),
      limit: Number(limit),
      sort,
      order
    });

    res.json({
      products: result.products,
      total: result.total,
      page: result.page,
      pages: Math.ceil(result.total / Number(limit))
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    next(error);
  }
});

// GET /api/products/:id
router.get('/:id', async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (error) {
    next(error);
  }
});

// POST /api/products — admin only
router.post('/', adminAuth, async (req, res, next) => {
  try {
    const { name, description, price, comparePrice, category, stock, variants, featured, images, specification, tags } = req.body;

    const product = await Product.create({
      name, description, price: Number(price), compare_price: Number(comparePrice || 0),
      category_id: category, stock: Number(stock || 0), images: images || [], variants: variants || [],
      featured: featured === true || featured === 'true',
      specification: specification || {},
      tags: tags || []
    });
    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
});

// PUT /api/products/:id — admin only
router.put('/:id', adminAuth, async (req, res, next) => {
  try {
    const { name, description, price, comparePrice, compare_price, category, category_id, stock, variants, featured, images, specification, tags, active } = req.body;

    const updateData = {
      name,
      description,
      price: Number(price),
      compare_price: Number(comparePrice || compare_price || 0),
      category_id: category_id || category,
      stock: Number(stock || 0),
      images: images || [],
      variants: variants || [],
      featured: featured === true || featured === 'true',
      specification: specification || {},
      tags: tags || [],
      active: active !== false
    };

    const product = await Product.update(req.params.id, updateData);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/products/:id — admin only
router.patch('/:id', adminAuth, async (req, res, next) => {
  try {
    const product = await Product.update(req.params.id, req.body);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/products/:id — admin only
router.delete('/:id', adminAuth, async (req, res, next) => {
  try {
    const deleted = await Product.delete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
