require('dotenv').config();
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Category = require('../models/Category');
const Event = require('../models/Event');

const CATEGORY_NAMES = ['Music', 'Tech', 'Sports'];

const SAMPLE_EVENTS = [
  {
    name: 'Summer Beats Festival',
    description: 'An open-air festival featuring local and international artists.',
    category: 'Music',
    city: 'Cairo',
    capacity: 500,
    daysFromNow: 30,
  },
  {
    name: 'DevCon Africa',
    description: 'A conference for developers covering web, mobile, and cloud engineering.',
    category: 'Tech',
    city: 'Mansoura',
    capacity: 200,
    daysFromNow: 45,
  },
  {
    name: 'City Marathon',
    description: 'An annual marathon through the city center, open to all skill levels.',
    category: 'Sports',
    city: 'Alexandria',
    capacity: 1000,
    daysFromNow: 60,
  },
];

const seed = async () => {
  await connectDB();

  const categoryDocs = {};
  for (const name of CATEGORY_NAMES) {
    const cat = await Category.findOneAndUpdate(
      { name },
      { name },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    categoryDocs[name] = cat;
  }
  console.log(`[seed] Categories ready: ${CATEGORY_NAMES.join(', ')}`);

  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@eventpulse.com').toLowerCase();
  let admin = await User.findOne({ email: adminEmail });
  if (!admin) {
    const hashed = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'ChangeMe123!', 12);
    admin = await User.create({
      name: 'EventPulse Admin',
      email: adminEmail,
      password: hashed,
      role: 'admin',
    });
    console.log(`[seed] Admin user created: ${adminEmail}`);
  } else {
    console.log(`[seed] Admin user already exists: ${adminEmail}`);
  }

  for (const e of SAMPLE_EVENTS) {
    const date = new Date();
    date.setDate(date.getDate() + e.daysFromNow);

    await Event.findOneAndUpdate(
      { name: e.name, city: e.city },
      {
        name: e.name,
        description: e.description,
        category: categoryDocs[e.category]._id,
        date,
        city: e.city,
        capacity: e.capacity,
        createdBy: admin._id,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
    );
  }
  console.log(`[seed] Sample events ready: ${SAMPLE_EVENTS.map((e) => e.name).join(', ')}`);

  console.log('[seed] Done.');
  await mongoose.connection.close();
  process.exit(0);
};

seed().catch((err) => {
  console.error('[seed] Failed:', err);
  process.exit(1);
});