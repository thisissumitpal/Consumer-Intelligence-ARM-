const Brand = require('../models/Brand');

// ── Create a brand ──────────────────────────────────────────────
exports.createBrand = async (req, res) => {
  try {
    const { name, category } = req.body;
    if (!name) return res.status(400).json({ error: 'Brand name is required.' });

    const brand = await Brand.findOneAndUpdate(
      { name },
      { category },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({ message: 'Brand created/updated.', brand });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── Get all brands ──────────────────────────────────────────────
exports.getBrands = async (req, res) => {
  try {
    const brands = await Brand.find().sort({ name: 1 });
    res.json({ brands });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
