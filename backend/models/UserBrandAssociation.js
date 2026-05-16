const mongoose = require('mongoose');

const userBrandAssociationSchema = new mongoose.Schema({
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
  acquisition_source: {
    type: String,
    enum: ['ORGANIC', 'FACEBOOK_ADS', 'GOOGLE_ADS', 'REFERRAL', 'EMAIL_CAMPAIGN', 'OTHER'],
    default: 'ORGANIC',
  },
  registered_at: {
    type: Date,
    default: Date.now,
  }
}, { timestamps: true });


userBrandAssociationSchema.index({ user: 1, brand: 1 }, { unique: true });

module.exports = mongoose.model('UserBrandAssociation', userBrandAssociationSchema);
