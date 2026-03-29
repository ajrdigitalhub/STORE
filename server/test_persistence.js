const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Order = require('./models/Order');
const User = require('./models/User');
const Product = require('./models/Product');

dotenv.config();

const testSave = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce');
    const user = await User.findOne();
    const product = await Product.findOne({ featured: true });

    if (!user || !product) {
      console.log('User or featured product not found');
      process.exit(1);
    }

    const order = new Order({
      user: user._id,
      items: [
        {
          product: product._id,
          name: product.name,
          price: product.price,
          quantity: 1,
          customName: 'Manual Test Name',
          customImage: '/uploads/test.jpg'
        }
      ],
      totalAmount: product.price,
      shippingAddress: {
        fullName: 'Test User',
        phone: '1234567890',
        street: 'Test St',
        city: 'Test City',
        state: 'TS',
        zipCode: '123456'
      },
      paymentMethod: 'cod'
    });

    const saved = await order.save();
    console.log('Saved Order:', JSON.stringify(saved, null, 2));
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

testSave();
