const Event = require('../models/Event');


async function computePropensityScore(userId) {
  const now = new Date();
  let score = 0;
  const signals = [];


  const events = await Event.find({ user: userId }).sort({ timestamp: -1 });

  if (events.length === 0) {
    return {
      score: 0,
      rationale: 'No activity recorded for this user.',
    };
  }


  const lastEvent = events[0];
  const daysSinceLast = (now - new Date(lastEvent.timestamp)) / (1000 * 60 * 60 * 24);
  let recencyScore = 0;
  if (daysSinceLast <= 3) {
    recencyScore = 35;
    signals.push('very recently active');
  } else if (daysSinceLast <= 7) {
    recencyScore = 28;
    signals.push('recently active');
  } else if (daysSinceLast <= 14) {
    recencyScore = 18;
    signals.push('moderately recent activity');
  } else if (daysSinceLast <= 30) {
    recencyScore = 8;
    signals.push('some recent activity');
  } else {
    recencyScore = 0;
    signals.push('inactive for over a month');
  }
  score += recencyScore;

 
  const purchases = events.filter(e => e.event_type === 'PURCHASE');
  const purchaseCount = purchases.length;
  let freqScore = 0;
  if (purchaseCount >= 10) {
    freqScore = 35;
    signals.push('high purchase frequency');
  } else if (purchaseCount >= 5) {
    freqScore = 25;
    signals.push('moderate purchase frequency');
  } else if (purchaseCount >= 2) {
    freqScore = 15;
    signals.push('low purchase frequency');
  } else if (purchaseCount === 1) {
    freqScore = 8;
    signals.push('single purchase recorded');
  } else {
    freqScore = 0;
    signals.push('no purchases');
  }
  score += freqScore;

  
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentEngagements = events.filter(
    e => ['APP_ACTIVITY', 'CONTENT_ENGAGEMENT'].includes(e.event_type) &&
         new Date(e.timestamp) >= thirtyDaysAgo
  );
  const engagementCount = recentEngagements.length;
  let engagementScore = 0;
  if (engagementCount >= 15) {
    engagementScore = 30;
    signals.push('very high recent engagement');
  } else if (engagementCount >= 8) {
    engagementScore = 22;
    signals.push('high recent engagement');
  } else if (engagementCount >= 3) {
    engagementScore = 12;
    signals.push('moderate recent engagement');
  } else if (engagementCount >= 1) {
    engagementScore = 5;
    signals.push('low recent engagement');
  } else {
    engagementScore = 0;
    signals.push('no recent engagement');
  }
  score += engagementScore;

  
  const capitalizedFirst = signals[0].charAt(0).toUpperCase() + signals[0].slice(1);
  const rationale = capitalizedFirst +
    (signals.length > 1 ? ' with ' + signals.slice(1).join(' and ') : '') + '.';

  return {
    score: Math.min(score, 100),
    breakdown: {
      recency: recencyScore,
      frequency: freqScore,
      engagement: engagementScore,
    },
    rationale,
  };
}

module.exports = { computePropensityScore };
