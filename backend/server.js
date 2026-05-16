require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const apiRoutes = require('./routes/api');
const seed = require('./seed/seedData');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/consumer_intelligence';


app.use(cors());
app.use(express.json());


app.use('/api', apiRoutes);


app.post('/api/seed', async (req, res) => {
  try {
    await seed();
    res.json({ message: 'Database seeded successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.get('/api/dashboard', async (req, res) => {
  try {
    const User = require('./models/User');
    const Brand = require('./models/Brand');
    const Event = require('./models/Event');
    const UserBrandAssociation = require('./models/UserBrandAssociation');

    const [totalUsers, totalBrands, totalEvents, totalAssociations] = await Promise.all([
      User.countDocuments(),
      Brand.countDocuments(),
      Event.countDocuments(),
      UserBrandAssociation.countDocuments(),
    ]);

  
    const lifecycleDist = await User.aggregate([
      { $group: { _id: '$lifecycle_stage', count: { $sum: 1 } } },
    ]);

  
    const eventDist = await Event.aggregate([
      { $group: { _id: '$event_type', count: { $sum: 1 } } },
    ]);

   
    const revenueByBrand = await Event.aggregate([
      { $match: { event_type: 'PURCHASE' } },
      { $group: { _id: '$brand', totalRevenue: { $sum: '$value' }, purchaseCount: { $sum: 1 } } },
      { $lookup: { from: 'brands', localField: '_id', foreignField: '_id', as: 'brand' } },
      { $unwind: '$brand' },
      { $project: { brandName: '$brand.name', totalRevenue: 1, purchaseCount: 1 } },
    ]);

    res.json({
      totalUsers,
      totalBrands,
      totalEvents,
      totalAssociations,
      lifecycleDistribution: lifecycleDist,
      eventDistribution: eventDist,
      revenueByBrand,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📡 API available at http://localhost:${PORT}/api`);
      console.log(`🌱 Seed data: POST http://localhost:${PORT}/api/seed`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });
