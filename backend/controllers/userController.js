const User = require('../models/User');
const Brand = require('../models/Brand');
const UserBrandAssociation = require('../models/UserBrandAssociation');
const Event = require('../models/Event');
const { computeSegments } = require('../services/segmentationEngine');
const { computePropensityScore } = require('../services/propensityScoring');

// ── Create or Update a User (Upsert by email) ──────────────────
exports.createUser = async (req, res) => {
  try {
    const { email, name, demographics, lifecycle_stage } = req.body;
    if (!email || !name) {
      return res.status(400).json({ error: 'email and name are required.' });
    }

    const user = await User.findOneAndUpdate(
      { email: email.toLowerCase().trim() },
      { name, demographics, lifecycle_stage },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({ message: 'User created/updated successfully.', user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── Get all users ───────────────────────────────────────────────
exports.getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(),
    ]);

    // For each user, attach brand count & latest event
    const enrichedUsers = await Promise.all(
      users.map(async (u) => {
        const brandCount = await UserBrandAssociation.countDocuments({ user: u._id });
        const lastEvent = await Event.findOne({ user: u._id }).sort({ timestamp: -1 });
        return {
          ...u.toObject(),
          brandCount,
          lastActivity: lastEvent ? lastEvent.timestamp : null,
        };
      })
    );

    res.json({ users: enrichedUsers, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── Get single user by ID with full profile ─────────────────────
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const associations = await UserBrandAssociation.find({ user: user._id }).populate('brand');
    const events = await Event.find({ user: user._id })
      .populate('brand', 'name')
      .sort({ timestamp: -1 })
      .limit(50);

    const segments = await computeSegments(user._id);
    const propensity = await computePropensityScore(user._id);

    res.json({
      user,
      brands: associations,
      events,
      intelligence: { segments, propensity },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── Register a user to a brand ──────────────────────────────────
exports.registerBrand = async (req, res) => {
  try {
    const { brandId, acquisition_source } = req.body;
    const userId = req.params.id;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const brand = await Brand.findById(brandId);
    if (!brand) return res.status(404).json({ error: 'Brand not found.' });

    const association = await UserBrandAssociation.findOneAndUpdate(
      { user: userId, brand: brandId },
      { acquisition_source, registered_at: new Date() },
      { new: true, upsert: true }
    );

    // Update lifecycle stage to ACTIVE if still NEW
    if (user.lifecycle_stage === 'NEW') {
      user.lifecycle_stage = 'ACTIVE';
      await user.save();
    }

    res.status(200).json({ message: 'Brand registration successful.', association });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── Get intelligence only (segments + propensity) ───────────────
exports.getIntelligence = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const segments = await computeSegments(user._id);
    const propensity = await computePropensityScore(user._id);

    res.json({ userId: user._id, segments, propensity });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
