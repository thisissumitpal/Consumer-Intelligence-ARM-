const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  name: {
    type: String,
    required: true,
  },
  demographics: {
    age: Number,
    gender: String,
    location: String,
  },
  lifecycle_stage: {
    type: String,
    enum: ['NEW', 'ACTIVE', 'DORMANT', 'CHURNED', 'TRANSITION_CANDIDATE'],
    default: 'NEW',
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
