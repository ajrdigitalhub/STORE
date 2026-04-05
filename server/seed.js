const pool = require('./db');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

const User = require('./models/User');
const Category = require('./models/Category');
const Product = require('./models/Product');
const Order = require('./models/Order');

const seed = async () => {
  try {
    console.log('Connected to PostgreSQL');

    // Clear existing data (be careful in production!)
    await pool.query('DELETE FROM orders');
    await pool.query('DELETE FROM products');
    await pool.query('DELETE FROM categories');
    await pool.query('DELETE FROM users');

    // Create admin
    const admin = await User.create({
      name: 'Admin',
      email: 'admin@store.com',
      password: await User.hashPassword('admin123'),
      role: 'admin',
      phone: '9999999999'
    });
    console.log('Admin created: admin@store.com / admin123');

    // Create test customer
    const customer = await User.create({
      name: 'John Doe',
      email: 'john@test.com',
      password: await User.hashPassword('password123'),
      role: 'customer',
      phone: '8888888888'
    });
    console.log('Customer created: john@test.com / password123');

    console.log('\nSeed completed successfully! (Users only)');
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
