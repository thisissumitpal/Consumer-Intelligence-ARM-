const Event = require('../models/Event');
const UserBrandAssociation = require('../models/UserBrandAssociation');

// Configurable thresholds
const CONFIG = {
  HIGH_VALUE_THRESHOLD: 500,        // Total spend > $500
  DORMANT_DAYS: 30,                  // No activity for 30 days
  CROSS_BRAND_MIN: 2,               // Registered in >= 2 brands
};

/**
 * Compute all applicable segments for a given user.
 * Returns an array of segment objects with name & reasoning.
 */
async function computeSegments(userId) {
  const segments = [];

  // ── 1. High Value User ────────────────────────────────────────
  const spendAgg = await Event.aggregate([
    { $match: { user: userId, event_type: 'PURCHASE' } },
    { $group: { _id: null, totalSpend: { $sum: '$value' } } },
  ]);
  const totalSpend = spendAgg.length > 0 ? spendAgg[0].totalSpend : 0;
  if (totalSpend >= CONFIG.HIGH_VALUE_THRESHOLD) {
    segments.push({
      name: 'HIGH_VALUE_USER',
      label: 'High Value User',
      reason: `Total spend of $${totalSpend.toFixed(2)} exceeds the $${CONFIG.HIGH_VALUE_THRESHOLD} threshold.`,
    });
  }

  // ── 2. Cross-Brand User ───────────────────────────────────────
  const brandCount = await UserBrandAssociation.countDocuments({ user: userId });
  if (brandCount >= CONFIG.CROSS_BRAND_MIN) {
    segments.push({
      name: 'CROSS_BRAND_USER',
      label: 'Cross-Brand User',
      reason: `Active across ${brandCount} brands.`,
    });
  }

  // ── 3. Dormant User ──────────────────────────────────────────
  const dormantCutoff = new Date();
  dormantCutoff.setDate(dormantCutoff.getDate() - CONFIG.DORMANT_DAYS);
  const recentEventCount = await Event.countDocuments({
    user: userId,
    timestamp: { $gte: dormantCutoff },
  });
  if (recentEventCount === 0) {
    segments.push({
      name: 'DORMANT_USER',
      label: 'Dormant User',
      reason: `No activity in the last ${CONFIG.DORMANT_DAYS} days.`,
    });
  }

  // ── 4. Lifecycle Transition Candidate ─────────────────────────
  // Heuristic: registered in >1 brand AND has engagement in a newer brand
  //            but no purchases there yet.
  if (brandCount >= 2) {
    const associations = await UserBrandAssociation.find({ user: userId })
      .sort({ registered_at: -1 });
    const newestBrandId = associations[0].brand;
    const purchasesInNewest = await Event.countDocuments({
      user: userId,
      brand: newestBrandId,
      event_type: 'PURCHASE',
    });
    const engagementInNewest = await Event.countDocuments({
      user: userId,
      brand: newestBrandId,
      event_type: { $in: ['APP_ACTIVITY', 'CONTENT_ENGAGEMENT'] },
    });
    if (purchasesInNewest === 0 && engagementInNewest > 0) {
      segments.push({
        name: 'LIFECYCLE_TRANSITION_CANDIDATE',
        label: 'Lifecycle Transition Candidate',
        reason: `Engaged with a newly registered brand but has not yet made a purchase there.`,
      });
    }
  }

  return segments;
}

module.exports = { computeSegments, CONFIG };
