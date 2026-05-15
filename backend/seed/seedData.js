const mongoose = require('mongoose');
const User = require('../models/User');
const Brand = require('../models/Brand');
const UserBrandAssociation = require('../models/UserBrandAssociation');
const Event = require('../models/Event');

const BRANDS_DATA = [
  { name: 'BabyBliss', category: 'Baby Care' },
  { name: 'GlowUp', category: 'Skincare' },
  { name: 'FitFuel', category: 'Health & Nutrition' },
  { name: 'TinySteps', category: 'Kids Fashion' },
  { name: 'ZenLife', category: 'Wellness' },
];

const USERS_DATA = [
  { email: 'priya.sharma@email.com', name: 'Priya Sharma', demographics: { age: 28, gender: 'Female', location: 'Mumbai' }, lifecycle_stage: 'ACTIVE' },
  { email: 'rahul.verma@email.com', name: 'Rahul Verma', demographics: { age: 35, gender: 'Male', location: 'Delhi' }, lifecycle_stage: 'ACTIVE' },
  { email: 'anita.gupta@email.com', name: 'Anita Gupta', demographics: { age: 42, gender: 'Female', location: 'Bangalore' }, lifecycle_stage: 'ACTIVE' },
  { email: 'vikram.singh@email.com', name: 'Vikram Singh', demographics: { age: 30, gender: 'Male', location: 'Hyderabad' }, lifecycle_stage: 'NEW' },
  { email: 'neha.patel@email.com', name: 'Neha Patel', demographics: { age: 25, gender: 'Female', location: 'Pune' }, lifecycle_stage: 'ACTIVE' },
  { email: 'arjun.reddy@email.com', name: 'Arjun Reddy', demographics: { age: 33, gender: 'Male', location: 'Chennai' }, lifecycle_stage: 'DORMANT' },
  { email: 'meera.nair@email.com', name: 'Meera Nair', demographics: { age: 29, gender: 'Female', location: 'Kochi' }, lifecycle_stage: 'ACTIVE' },
  { email: 'sanjay.joshi@email.com', name: 'Sanjay Joshi', demographics: { age: 45, gender: 'Male', location: 'Ahmedabad' }, lifecycle_stage: 'CHURNED' },
  { email: 'divya.krishnan@email.com', name: 'Divya Krishnan', demographics: { age: 31, gender: 'Female', location: 'Kolkata' }, lifecycle_stage: 'ACTIVE' },
  { email: 'amit.desai@email.com', name: 'Amit Desai', demographics: { age: 38, gender: 'Male', location: 'Jaipur' }, lifecycle_stage: 'ACTIVE' },
  { email: 'test.highvalue@email.com', name: 'Test HighValue', demographics: { age: 30, gender: 'Female', location: 'Mumbai' }, lifecycle_stage: 'ACTIVE' },
  { email: 'test.crossbrand@email.com', name: 'Test CrossBrand', demographics: { age: 28, gender: 'Male', location: 'Delhi' }, lifecycle_stage: 'ACTIVE' },
  { email: 'test.dormant@email.com', name: 'Test Dormant', demographics: { age: 40, gender: 'Female', location: 'Bangalore' }, lifecycle_stage: 'DORMANT' },
];

const ACQUISITION_SOURCES = ['ORGANIC', 'FACEBOOK_ADS', 'GOOGLE_ADS', 'REFERRAL', 'EMAIL_CAMPAIGN'];
const EVENT_TYPES = ['PURCHASE', 'APP_ACTIVITY', 'CONTENT_ENGAGEMENT', 'OTHER'];

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(daysBack) {
  const d = new Date();
  d.setDate(d.getDate() - Math.floor(Math.random() * daysBack));
  d.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));
  return d;
}

async function seed() {
  console.log('🌱 Seeding database...');

  // Clear existing data
  await Promise.all([
    User.deleteMany({}),
    Brand.deleteMany({}),
    UserBrandAssociation.deleteMany({}),
    Event.deleteMany({}),
  ]);
  console.log('   ✓ Cleared existing data');

  // Create brands
  const brands = await Brand.insertMany(BRANDS_DATA);
  console.log(`   ✓ Created ${brands.length} brands`);

  // Create users
  const users = await User.insertMany(USERS_DATA);
  console.log(`   ✓ Created ${users.length} users`);

  // Create brand associations
  const associations = [];
  for (const user of users) {
    // Each user registers to 1-3 brands
    const numBrands = Math.floor(Math.random() * 3) + 1;
    const shuffled = [...brands].sort(() => 0.5 - Math.random());
    for (let i = 0; i < numBrands; i++) {
      associations.push({
        user: user._id,
        brand: shuffled[i]._id,
        acquisition_source: randomItem(ACQUISITION_SOURCES),
        registered_at: randomDate(90),
      });
    }
  }
  await UserBrandAssociation.insertMany(associations);
  console.log(`   ✓ Created ${associations.length} brand associations`);

  // Create events
  const events = [];
  for (const user of users) {
    const userAssocs = associations.filter(a => a.user.equals(user._id));

    // Determine event count based on lifecycle stage for realistic data
    let eventCount;
    switch (user.lifecycle_stage) {
      case 'ACTIVE': eventCount = Math.floor(Math.random() * 20) + 8; break;
      case 'NEW': eventCount = Math.floor(Math.random() * 3) + 1; break;
      case 'DORMANT': eventCount = Math.floor(Math.random() * 5) + 2; break;
      case 'CHURNED': eventCount = Math.floor(Math.random() * 3); break;
      default: eventCount = 5;
    }

    for (let i = 0; i < eventCount; i++) {
      const assoc = randomItem(userAssocs);
      let eventType = randomItem(EVENT_TYPES);
      let value = 0;

      // Force High Value for test user
      if (user.email === 'test.highvalue@email.com') {
        eventType = 'PURCHASE';
        value = 200; // 3 purchases will exceed 500
      }

      // For DORMANT users, events should be older than 30 days
      let timestamp;
      if (user.lifecycle_stage === 'DORMANT') {
        timestamp = randomDate(120);
        timestamp.setDate(timestamp.getDate() - 35);
      } else if (user.lifecycle_stage === 'CHURNED') {
        timestamp = randomDate(180);
        timestamp.setDate(timestamp.getDate() - 60);
      } else {
        timestamp = randomDate(60);
      }

      events.push({
        user: user._id,
        brand: assoc.brand,
        event_type: eventType,
        timestamp,
        value: value > 0 ? value : (eventType === 'PURCHASE'
          ? parseFloat((Math.random() * 200 + 10).toFixed(2))
          : 0),
        metadata: eventType === 'PURCHASE'
          ? { product: `Product-${Math.floor(Math.random() * 100)}`, currency: 'INR' }
          : eventType === 'CONTENT_ENGAGEMENT'
          ? { content: `Article-${Math.floor(Math.random() * 50)}`, duration_sec: Math.floor(Math.random() * 300) }
          : { action: `action_${Math.floor(Math.random() * 20)}` },
      });
    }
  }
  await Event.insertMany(events);
  console.log(`   ✓ Created ${events.length} events`);

  console.log('\n✅ Seed complete!');
  console.log(`   Brands: ${brands.length}`);
  console.log(`   Users: ${users.length}`);
  console.log(`   Associations: ${associations.length}`);
  console.log(`   Events: ${events.length}`);
}

module.exports = seed;
