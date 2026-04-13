const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const User = require('./models/User');
const Product = require('./models/Product');
const Category = require('./models/Category');
const Order = require('./models/Order');

const cleanup = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce');
    console.log('Connected to MongoDB');

    // Deleting all data
    const userResult = await User.deleteMany({});
    const productResult = await Product.deleteMany({});
    const categoryResult = await Category.deleteMany({});
    const orderResult = await Order.deleteMany({});

    console.log('--- Cleanup Summary ---');
    console.log(`Users deleted: ${userResult.deletedCount}`);
    console.log(`Products deleted: ${productResult.deletedCount}`);
    console.log(`Categories deleted: ${categoryResult.deletedCount}`);
    console.log(`Orders deleted: ${orderResult.deletedCount}`);
    console.log('------------------------');

    console.log('Database cleanup completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Cleanup failed:', error);
    process.exit(1);
  }
};

cleanup();
