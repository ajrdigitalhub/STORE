const mongoose = require('mongoose');

const contactConfigSchema = new mongoose.Schema({
  address: {
    type: String,
    required: true,
    default: 'Ideazone3D Headquarters, HITEC City, Hyderabad, Telangana, India 500081'
  },
  phone: {
    type: String,
    required: true,
    default: '+91 99890 13142'
  },
  email: {
    type: String,
    required: true,
    default: 'ideazone3d@gmail.com'
  },
  workingHours: {
    type: String,
    required: true,
    default: 'Mon - Sat, 9am - 7pm'
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('ContactConfig', contactConfigSchema);
