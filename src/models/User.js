'use strict';

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

/**
 * @typedef {object} IUser
 * @property {string} username
 * @property {string} email
 * @property {string} password   - bcrypt hash, never stored plaintext
 * @property {'admin'|'staff'|'viewer'} role
 * @property {boolean} isActive
 * @property {Date}   lastLoginAt
 * @property {number} loginCount
 */
const userSchema = new mongoose.Schema({
  username:    { type: String, required: true, unique: true, trim: true, minlength: 3, maxlength: 30 },
  email:       { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:    { type: String, required: true, select: true },
  role:        { type: String, enum: ['admin', 'staff', 'viewer'], default: 'staff' },
  isActive:    { type: Boolean, default: true },
  lastLoginAt: { type: Date, default: null },
  loginCount:  { type: Number, default: 0 },
}, {
  timestamps: true,
  toJSON: { virtuals: true, transform: (_doc, ret) => { delete ret.password; return ret; } },
});

/* ── Indexes ─────────────────────────────────────────────────────────────────── */
userSchema.index({ email: 1 });

/* ── Hooks ───────────────────────────────────────────────────────────────────── */
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

/* ── Instance Methods ────────────────────────────────────────────────────────── */

/** @returns {Promise<boolean>} */
userSchema.methods.comparePassword = function (plaintext) {
  return bcrypt.compare(plaintext, this.password);
};

/** Records login timestamp and increments counter atomically. */
userSchema.methods.recordLogin = function () {
  return this.constructor.findByIdAndUpdate(
    this._id,
    { $set: { lastLoginAt: new Date() }, $inc: { loginCount: 1 } },
    { new: true }
  );
};

/* ── Virtuals ─────────────────────────────────────────────────────────────────── */
userSchema.virtual('initials').get(function () {
  return this.username.slice(0, 2).toUpperCase();
});

module.exports = mongoose.model('User', userSchema);
