const express = require('express');
const multer = require('multer');
const path = require('path');
const Product = require('../models/Product');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// Multer config for product images
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1e9) + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|gif/;
    const extOk = allowed.test(path.extname(file.originalname).toLowerCase());
    const mimeOk = allowed.test(file.mimetype);
    if (extOk && mimeOk) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  }
});

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
router.post('/', adminAuth, upload.array('images', 5), async (req, res, next) => {
  try {
    const { name, description, price, comparePrice, category, stock, variants, featured } = req.body;
    const images = req.files ? req.files.map(f => `/uploads/${f.filename}`) : [];

    let parsedVariants = [];
    if (variants) {
      try { parsedVariants = JSON.parse(variants); } catch (e) { parsedVariants = []; }
    }

    const product = await Product.create({
      name, description, price: Number(price), compare_price: Number(comparePrice || 0),
      categoryid: category, stock: Number(stock || 0), images, variants: parsedVariants,
      featured: featured === 'true'
    });
    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
});

// PUT /api/products/:id — admin only
router.put('/:id', adminAuth, upload.array('images', 5), async (req, res, next) => {
  try {
    const { name, description, price, comparePrice, category, stock, variants, featured, existingImages } = req.body;
    const newImages = req.files ? req.files.map(f => `/uploads/${f.filename}`) : [];

    let parsedExisting = [];
    if (existingImages) {
      try { parsedExisting = JSON.parse(existingImages); } catch (e) { parsedExisting = []; }
    }

    let parsedVariants = [];
    if (variants) {
      try { parsedVariants = JSON.parse(variants); } catch (e) { parsedVariants = []; }
    }

    const updateData = {
      name, description, price: Number(price), compare_price: Number(comparePrice || 0),
      categoryid: category, stock: Number(stock || 0), images: [...parsedExisting, ...newImages],
      variants: parsedVariants, featured: featured === 'true'
    };

    const product = await Product.update(req.params.id, updateData);
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
