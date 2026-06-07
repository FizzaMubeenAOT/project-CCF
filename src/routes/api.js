'use strict';

/**
 * @module routes/api
 * Stateless JSON API — useful for Postman testing, CI/CD health checks,
 * and the bonus Helm/Prometheus tasks.
 */

const express  = require('express');
const router   = express.Router();
const Student  = require('../models/Student');
const AuditLog = require('../models/AuditLog');
const db       = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

// GET /api/students  — paginated, filterable list
router.get('/students', asyncHandler(async (req, res) => {
  const { dept, status, semester, page = 1, limit = 20 } = req.query;
  const filter = Student.buildFilter({ dept, status, semester });

  const [data, total] = await Promise.all([
    Student.find(filter).skip((page - 1) * limit).limit(Number(limit)).lean(),
    Student.countDocuments(filter),
  ]);
  res.json({ success: true, total, page: Number(page), data });
}));

// GET /api/students/:id
router.get('/students/:id', asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id).lean({ virtuals: true });
  if (!student) return res.status(404).json({ success: false, message: 'Not found' });
  res.json({ success: true, data: student });
}));

// GET /api/stats
router.get('/stats', asyncHandler(async (_req, res) => {
  const stats = await Student.getDashboardStats();
  res.json({ success: true, data: stats });
}));

// GET /api/audit/:studentId
router.get('/audit/:id', asyncHandler(async (req, res) => {
  const logs = await AuditLog.find({ documentId: req.params.id }).sort({ createdAt: -1 }).limit(20).lean();
  res.json({ success: true, data: logs });
}));

// GET /api/health  — public, no auth
router.get('/health', (_req, res) => {
  res.json({
    status:    'ok',
    db:        db.isConnected() ? 'connected' : 'disconnected',
    uptime:    Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
