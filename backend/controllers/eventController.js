const Event = require('../models/Event');
const User = require('../models/User');
const Brand = require('../models/Brand');

// ── Log a new event ─────────────────────────────────────────────
exports.createEvent = async (req, res) => {
  try {
    const { userId, brandId, event_type, value, metadata, timestamp } = req.body;

    if (!userId || !brandId || !event_type) {
      return res.status(400).json({ error: 'userId, brandId, and event_type are required.' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const brand = await Brand.findById(brandId);
    if (!brand) return res.status(404).json({ error: 'Brand not found.' });

    const event = await Event.create({
      user: userId,
      brand: brandId,
      event_type,
      value: value || 0,
      metadata: metadata || {},
      timestamp: timestamp || new Date(),
    });

    // Update lifecycle_stage to ACTIVE if dormant/new
    if (['NEW', 'DORMANT', 'CHURNED'].includes(user.lifecycle_stage)) {
      user.lifecycle_stage = 'ACTIVE';
      await user.save();
    }

    res.status(201).json({ message: 'Event logged successfully.', event });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── Get events with optional filters ────────────────────────────
exports.getEvents = async (req, res) => {
  try {
    const { userId, brandId, event_type, limit = 50, page = 1 } = req.query;
    const filter = {};
    if (userId) filter.user = userId;
    if (brandId) filter.brand = brandId;
    if (event_type) filter.event_type = event_type;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [events, total] = await Promise.all([
      Event.find(filter)
        .populate('user', 'name email')
        .populate('brand', 'name')
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Event.countDocuments(filter),
    ]);

    res.json({ events, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
