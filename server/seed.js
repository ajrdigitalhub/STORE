const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

const User = require('./models/User');
const Category = require('./models/Category');
const Product = require('./models/Product');

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce');
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Category.deleteMany({});
    await Product.deleteMany({});

    // Create admin
    const admin = new User({
      name: 'Admin',
      email: 'admin@store.com',
      password: 'admin123',
      role: 'admin',
      phone: '9999999999'
    });
    await admin.save();
    console.log('Admin created: admin@store.com / admin123');

    // Create test customer
    const customer = new User({
      name: 'John Doe',
      email: 'john@test.com',
      password: 'password123',
      role: 'customer',
      phone: '8888888888'
    });
    await customer.save();
    console.log('Customer created: john@test.com / password123');

    // Create categories
    const categories = await Category.insertMany([
      { name: 'Electronics', description: 'Smartphones, laptops, gadgets and more' },
      { name: 'Fashion', description: 'Clothing, accessories, and footwear' },
      { name: 'Home & Living', description: 'Furniture, decor, and kitchen essentials' },
      { name: 'Books', description: 'Fiction, non-fiction, and educational books' },
      { name: 'Sports', description: 'Sports equipment and fitness gear' }
    ]);
    console.log(`${categories.length} categories created`);

    // Create products
    const products = await Product.insertMany([
      {
        name: 'Premium Wireless Headphones',
        description: 'High-fidelity wireless headphones with active noise cancellation, 30-hour battery life, and premium comfort padding. Perfect for music lovers and professionals.',
        price: 4999,
        comparePrice: 7999,
        category: categories[0]._id,
        stock: 50,
        featured: true,
        variants: [{ name: 'Color', options: ['Matte Black', 'Silver', 'White'] }]
      },
      {
        name: 'Ultra Slim Laptop 15"',
        description: 'Powerful ultra-thin laptop with 16GB RAM, 512GB SSD, Intel i7 processor, and stunning 4K display. Ideal for work and entertainment.',
        price: 64999,
        comparePrice: 79999,
        category: categories[0]._id,
        stock: 20,
        featured: true,
        variants: [{ name: 'Storage', options: ['256GB', '512GB', '1TB'] }]
      },
      {
        name: 'Smart Watch Pro',
        description: 'Feature-packed smartwatch with health monitoring, GPS tracking, water resistance up to 50m, and 7-day battery life.',
        price: 12999,
        comparePrice: 18999,
        category: categories[0]._id,
        stock: 35,
        featured: true,
        variants: [{ name: 'Size', options: ['40mm', '44mm'] }]
      },
      {
        name: 'Classic Cotton Shirt',
        description: 'Premium cotton shirt with a modern slim fit. Available in multiple colors. Perfect for both casual and formal occasions.',
        price: 1499,
        comparePrice: 2499,
        category: categories[1]._id,
        stock: 100,
        variants: [{ name: 'Size', options: ['S', 'M', 'L', 'XL', 'XXL'] }, { name: 'Color', options: ['White', 'Black', 'Grey'] }]
      },
      {
        name: 'Leather Jacket',
        description: 'Genuine leather jacket with a sleek modern design. Features zip closure, inner pockets, and premium stitching.',
        price: 8999,
        comparePrice: 14999,
        category: categories[1]._id,
        stock: 25,
        featured: true,
        variants: [{ name: 'Size', options: ['S', 'M', 'L', 'XL'] }]
      },
      {
        name: 'Running Sneakers',
        description: 'Lightweight running sneakers with cushioned sole, breathable mesh upper, and excellent grip for all terrains.',
        price: 3499,
        comparePrice: 5999,
        category: categories[1]._id,
        stock: 60,
        variants: [{ name: 'Size', options: ['7', '8', '9', '10', '11'] }, { name: 'Color', options: ['Black', 'White', 'Grey'] }]
      },
      {
        name: 'Minimalist Desk Lamp',
        description: 'Modern LED desk lamp with adjustable brightness, color temperature control, and USB charging port. Sleek metallic design.',
        price: 2499,
        comparePrice: 3999,
        category: categories[2]._id,
        stock: 40,
        variants: [{ name: 'Color', options: ['Silver', 'Black'] }]
      },
      {
        name: 'Ergonomic Office Chair',
        description: 'Premium ergonomic office chair with lumbar support, adjustable armrests, breathable mesh back, and 360-degree swivel.',
        price: 15999,
        comparePrice: 24999,
        category: categories[2]._id,
        stock: 15,
        featured: true,
        variants: [{ name: 'Color', options: ['Black', 'Grey'] }]
      },
      {
        name: 'The Art of Programming',
        description: 'A comprehensive guide to modern software development practices, design patterns, and clean code principles. 500+ pages.',
        price: 699,
        comparePrice: 999,
        category: categories[3]._id,
        stock: 200,
        variants: [{ name: 'Format', options: ['Paperback', 'Hardcover'] }]
      },
      {
        name: 'Professional Yoga Mat',
        description: 'Extra-thick 6mm yoga mat with non-slip surface, alignment markings, and carrying strap. Eco-friendly materials.',
        price: 1999,
        comparePrice: 2999,
        category: categories[4]._id,
        stock: 80,
        variants: [{ name: 'Color', options: ['Black', 'Grey', 'Dark Grey'] }]
      },
      {
        name: 'Bluetooth Speaker',
        description: 'Portable Bluetooth speaker with 360-degree sound, waterproof IPX7 rating, and 12-hour battery life. Compact and powerful.',
        price: 3999,
        comparePrice: 5999,
        category: categories[0]._id,
        stock: 45,
        variants: [{ name: 'Color', options: ['Black', 'Silver'] }]
      },
      {
        name: 'Premium Coffee Maker',
        description: 'Automatic drip coffee maker with built-in grinder, programmable timer, and thermal carafe. Brews up to 12 cups.',
        price: 6999,
        comparePrice: 9999,
        category: categories[2]._id,
        stock: 30,
        variants: [{ name: 'Color', options: ['Stainless Steel', 'Matte Black'] }]
      }
    ]);
    console.log(`${products.length} products created`);

    console.log('\nSeed completed successfully!');
    console.log('---');
    console.log('Admin Login: admin@store.com / admin123');
    console.log('Customer Login: john@test.com / password123');

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seed();
