'use strict';

const mongoose = require('mongoose');

/** Canonical department list — shared with routes & views */
const DEPARTMENTS = [
  'Computer Science',
  'Software Engineering',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Business Administration',
  'Mathematics & Statistics',
  'Physics',
  'Biotechnology',
  'Data Science',
  'Artificial Intelligence',
];

const STATUSES = ['active', 'inactive', 'graduated', 'suspended'];

const studentSchema = new mongoose.Schema({
  studentId:  { type: String, required: true, unique: true, uppercase: true, trim: true },
  firstName:  { type: String, required: true, trim: true },
  lastName:   { type: String, required: true, trim: true },
  email:      { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone:      { type: String, trim: true, default: '' },
  department: { type: String, required: true, enum: DEPARTMENTS },
  semester:   { type: Number, required: true, min: 1, max: 8 },
  cgpa:       { type: Number, min: 0.0, max: 4.0, default: null },
  status:     { type: String, enum: STATUSES, default: 'active' },
  gender:     { type: String, enum: ['male', 'female', 'other', 'prefer_not'], default: 'prefer_not' },
  dob:        { type: Date, default: null },
  address:    { type: String, trim: true, default: '' },
  guardian:   { type: String, trim: true, default: '' },
  enrolledAt: { type: Date, default: Date.now },
  notes:      { type: String, maxlength: 600, default: '' },
  createdBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true,
  toJSON:   { virtuals: true },
  toObject: { virtuals: true },
});

/* ── Compound indexes for common query patterns ───────────────────────────────── */
studentSchema.index({ department: 1, status: 1 });
studentSchema.index({ semester: 1 });
studentSchema.index({ cgpa: -1 });
// Full-text search across name + id + email
studentSchema.index(
  { firstName: 'text', lastName: 'text', studentId: 'text', email: 'text' },
  { weights: { studentId: 10, firstName: 5, lastName: 5, email: 2 } }
);

/* ── Virtuals ─────────────────────────────────────────────────────────────────── */
studentSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

/**
 * Letter-grade equivalent of CGPA (4.0 scale).
 * @returns {string}
 */
studentSchema.virtual('cgpaGrade').get(function () {
  const g = this.cgpa;
  if (g == null) return '—';
  if (g >= 3.7) return 'A';
  if (g >= 3.3) return 'A−';
  if (g >= 3.0) return 'B+';
  if (g >= 2.7) return 'B';
  if (g >= 2.3) return 'B−';
  if (g >= 2.0) return 'C+';
  return 'C';
});

/** Returns age in whole years, or null if dob is missing. */
studentSchema.virtual('age').get(function () {
  if (!this.dob) return null;
  return Math.floor((Date.now() - new Date(this.dob)) / (365.25 * 24 * 3600 * 1000));
});

/* ── Static helpers ───────────────────────────────────────────────────────────── */

/**
 * Fetches all metrics needed for the dashboard in ONE aggregation pass
 * using $facet so we hit MongoDB only once.
 * @returns {Promise<object>}
 */
studentSchema.statics.getDashboardStats = async function () {
  const [result] = await this.aggregate([
    {
      $facet: {
        byStatus: [
          { $group: { _id: '$status', count: { $sum: 1 } } },
        ],
        byDept: [
          { $group: { _id: '$department', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 8 },
        ],
        bySemester: [
          { $group: { _id: '$semester', count: { $sum: 1 } } },
          { $sort: { _id: 1 } },
        ],
        cgpaStats: [
          { $match: { cgpa: { $ne: null } } },
          { $group: { _id: null, avg: { $avg: '$cgpa' }, max: { $max: '$cgpa' }, min: { $min: '$cgpa' } } },
        ],
        recent: [
          { $sort: { createdAt: -1 } },
          { $limit: 8 },
          { $project: { firstName: 1, lastName: 1, studentId: 1, department: 1, status: 1, cgpa: 1, createdAt: 1 } },
        ],
        cgpaDistribution: [
          { $match: { cgpa: { $ne: null } } },
          {
            $bucket: {
              groupBy: '$cgpa',
              boundaries: [0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.01],
              default: 'Other',
              output: { count: { $sum: 1 } },
            }
          }
        ],
      }
    }
  ]);

  const statusMap = (result.byStatus || []).reduce((acc, s) => {
    acc[s._id] = s.count;
    return acc;
  }, {});

  return {
    total:              Object.values(statusMap).reduce((a, b) => a + b, 0),
    active:             statusMap.active    || 0,
    inactive:           statusMap.inactive  || 0,
    graduated:          statusMap.graduated || 0,
    suspended:          statusMap.suspended || 0,
    byDept:             result.byDept             || [],
    bySemester:         result.bySemester         || [],
    cgpaStats:          result.cgpaStats[0]        || { avg: null, max: null, min: null },
    recent:             result.recent              || [],
    cgpaDistribution:   result.cgpaDistribution   || [],
  };
};

/**
 * Builds a Mongoose filter from sanitised query params.
 * @param {{ search?, dept?, status?, semester?, minCgpa?, maxCgpa? }} params
 * @returns {object} Mongoose filter
 */
studentSchema.statics.buildFilter = function ({ search, dept, status, semester, minCgpa, maxCgpa } = {}) {
  const filter = {};
  if (search) {
    // Use text index when available; fall back to regex for short strings
    const clean = search.trim();
    if (clean.length >= 3) {
      filter.$text = { $search: clean };
    } else {
      filter.$or = [
        { firstName: new RegExp(clean, 'i') },
        { lastName:  new RegExp(clean, 'i') },
        { studentId: new RegExp(clean, 'i') },
      ];
    }
  }
  if (dept)     filter.department = dept;
  if (status)   filter.status     = status;
  if (semester) filter.semester   = Number(semester);
  if (minCgpa || maxCgpa) {
    filter.cgpa = {};
    if (minCgpa) filter.cgpa.$gte = Number(minCgpa);
    if (maxCgpa) filter.cgpa.$lte = Number(maxCgpa);
  }
  return filter;
};

module.exports = mongoose.model('Student', studentSchema);
module.exports.DEPARTMENTS = DEPARTMENTS;
module.exports.STATUSES    = STATUSES;
