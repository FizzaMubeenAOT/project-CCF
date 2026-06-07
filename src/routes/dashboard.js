'use strict';

const express  = require('express');
const router   = express.Router();
const Student  = require('../models/Student');
const { requireAuth } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

router.get('/', requireAuth, asyncHandler(async (req, res) => {
  const stats = await Student.getDashboardStats();
  res.render('dashboard', { stats, title: 'Dashboard' });
}));

module.exports = router;
