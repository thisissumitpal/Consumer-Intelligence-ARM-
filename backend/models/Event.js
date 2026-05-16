const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  brand: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Brand',
    required: true,
  },
  event_type: {
    type: String,
    enum: ['PURCHASE', 'APP_ACTIVITY', 'CONTENT_ENGAGEMENT', 'OTHER'],
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  value: {
    type: Number,
    default: 0,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  }
}, { timestamps: true });


eventSchema.index({ user: 1, timestamp: -1 });
eventSchema.index({ user: 1, event_type: 1 });
eventSchema.index({ brand: 1 });

module.exports = mongoose.model('Event', eventSchema);
