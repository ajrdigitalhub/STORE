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
    const { search, category, minPrice, maxPrice, featured, page = 1, limit = 12, sort = '-createdAt' } = req.query;
    const filter = { active: true };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    if (category) filter.category = category;
    if (featured === 'true') filter.featured = true;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [products, total] = await Promise.all([
      Product.find(filter).populate('category', 'name').sort(sort).skip(skip).limit(Number(limit)),
      Product.countDocuments(filter)
    ]);

    res.json({
      products,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit))
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/products/:id
router.get('/:id', async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).populate('category', 'name');
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

    const product = new Product({
      name, description, price: Number(price), comparePrice: Number(comparePrice || 0),
      category, stock: Number(stock || 0), images, variants: parsedVariants,
      featured: featured === 'true'
    });
    await product.save();
    await product.populate('category', 'name');
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
      name, description, price: Number(price), comparePrice: Number(comparePrice || 0),
      category, stock: Number(stock || 0), images: [...parsedExisting, ...newImages],
      variants: parsedVariants, featured: featured === 'true'
    };

    const product = await Product.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true })
      .populate('category', 'name');
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/products/:id — admin only
router.delete('/:id', adminAuth, async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
