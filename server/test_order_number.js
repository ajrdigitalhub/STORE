const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Order = require('./models/Order');
const User = require('./models/User');
const Product = require('./models/Product');

dotenv.config();

const testOrderNumber = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce');
    console.log('Connected to MongoDB');

    let user = await User.findOne();
    if (!user) {
      user = new User({
        name: 'Test Admin',
        email: 'test@admin.com',
        password: 'password123',
        role: 'admin',
        phone: '1234567890'
      });
      await user.save();
    }

    let product = await Product.findOne();
    if (!product) {
       product = new Product({
         name: 'Test Product',
         description: 'Test Description',
         price: 100,
         stock: 10,
         category: new mongoose.Types.ObjectId(), // Just a placeholder
         featured: true
       });
       await product.save();
    }

    const orderData = {
      user: user._id,
      items: [{
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: 1
      }],
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
    };

    console.log('Creating first order...');
    const order1 = new Order(orderData);
    await order1.save();
    console.log('Order 1 Number:', order1.orderNumber);

    console.log('Creating second order...');
    const order2 = new Order(orderData);
    await order2.save();
    console.log('Order 2 Number:', order2.orderNumber);

    if (order1.orderNumber.startsWith('ORD-') && order2.orderNumber.startsWith('ORD-') && order1.orderNumber !== order2.orderNumber) {
      console.log('SUCCESS: Order numbers generated correctly and are unique.');
    } else {
      console.log('FAILURE: Order number format or uniqueness check failed.');
    }

    process.exit(0);
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
};

testOrderNumber();
