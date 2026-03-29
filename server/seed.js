const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

const User = require('./models/User');
const Category = require('./models/Category');
const Product = require('./models/Product');
const Order = require('./models/Order');

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce');
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Category.deleteMany({});
    await Product.deleteMany({});
    await Order.deleteMany({});

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
