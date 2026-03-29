const mongoose = require('mongoose');

const aboutSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    default: 'About Us'
  },
  subtitle: {
    type: String,
    required: true,
    default: 'Discover Our Story'
  },
  description: {
    type: String,
    required: true,
    default: 'Premium products with exceptional craftsmanship.'
  },
  mission: {
    type: String,
    required: true,
    default: 'To provide high-quality products that inspire.'
  },
  vision: {
    type: String,
    required: true,
    default: 'To be the leading choice for premium lifestyle products.'
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('About', aboutSchema);
