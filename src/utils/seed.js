#!/usr/bin/env node
'use strict';

/**
 * @file seed.js
 * Populates the database with realistic demo data for development/demo.
 * Usage:  node src/utils/seed.js
 *         MONGO_URI=mongodb://... node src/utils/seed.js
 */

const mongoose = require('mongoose');
const config   = require('../config');
const Student  = require('../models/Student');
const User     = require('../models/User');
const { DEPARTMENTS } = require('../models/Student');

const FIRST_NAMES = ['Ali','Sara','Ahmed','Fatima','Umar','Zainab','Hassan','Aisha','Bilal','Hira','Omar','Maryam','Kamran','Sana','Tariq','Nadia','Imran','Rabia','Faisal','Layla'];
const LAST_NAMES  = ['Khan','Ahmed','Malik','Sheikh','Butt','Chaudhry','Raza','Siddiqui','Mirza','Hussain','Qureshi','Ansari','Baig','Akhtar','Abbasi'];
const STATUSES    = ['active','active','active','active','inactive','graduated'];  // weighted

function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randCgpa() { return Math.round((Math.random() * 2 + 2) * 100) / 100; }  // 2.00–4.00

async function seed() {
  await mongoose.connect(config.db.uri, config.db.options);
  console.log('✅  Connected to MongoDB');

  // Clear existing demo data
  await Promise.all([Student.deleteMany({}), User.deleteMany({})]);
  console.log('🗑   Cleared existing data');

  // Create admin user
  await User.create({
    username: 'admin',
    email:    'admin@edutrack.dev',
    password: 'admin123',
    role:     'admin',
  });
  console.log('👤  Admin user created  →  admin / admin123');

  // Generate students
  const students = [];
  for (let i = 1; i <= 60; i++) {
    const fn = rand(FIRST_NAMES);
    const ln = rand(LAST_NAMES);
    const yr = randInt(21, 24);
    students.push({
      studentId:  `STU-20${yr}-${String(i).padStart(3, '0')}`,
      firstName:  fn,
      lastName:   ln,
      email:      `${fn.toLowerCase()}.${ln.toLowerCase()}${i}@uni.edu`,
      phone:      `+92 3${randInt(0,4)}${String(randInt(1000000,9999999))}`,
      department: rand(DEPARTMENTS),
      semester:   randInt(1, 8),
      cgpa:       Math.random() > 0.1 ? randCgpa() : null,
      status:     rand(STATUSES),
      gender:     rand(['male','female']),
      enrolledAt: new Date(Date.now() - randInt(30, 900) * 24 * 3600 * 1000),
    });
  }

  await Student.insertMany(students);
  console.log(`🎓  ${students.length} students seeded`);

  await mongoose.disconnect();
  console.log('✅  Done. Run: npm start');
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
