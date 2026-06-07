'use strict';

const express      = require('express');
const router       = express.Router();
const ctrl         = require('../controllers/userController');
const asyncHandler = require('../utils/asyncHandler');
const { requireAuth, requireRole } = require('../middleware/auth');

router.use(requireAuth, requireRole('admin'));

router.get('/', asyncHandler(ctrl.index));
router.post('/:id/role', asyncHandler(ctrl.updateRole));
router.post('/:id/toggle', asyncHandler(ctrl.toggleActive));

module.exports = router;
