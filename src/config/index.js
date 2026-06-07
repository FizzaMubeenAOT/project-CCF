'use strict';

/**
 * @module config
 * Central configuration — reads env vars with sensible defaults.
 * All other modules import from here; no scattered process.env calls.
 */
module.exports = {
  app: {
    port:    parseInt(process.env.PORT, 10) || 3000,
    env:     process.env.NODE_ENV || 'development',
    secret:  process.env.SESSION_SECRET || 'change-me-in-production',
    name:    'EduTrack',
  },
  db: {
    uri:     process.env.MONGO_URI || 'mongodb://localhost:27017/edutrack',
    options: {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    },
  },
  pagination: {
    defaultLimit: 12,
  },
  rateLimit: {
    auth: { windowMs: 15 * 60 * 1000, max: 25 },
  },
};
