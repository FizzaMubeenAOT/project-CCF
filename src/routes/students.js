'use strict';

const express  = require('express');
const router   = express.Router();
const ctrl     = require('../controllers/studentController');
const asyncHandler  = require('../utils/asyncHandler');
const { requireAuth, requireRole } = require('../middleware/auth');

router.use(requireAuth);

router.get('/',              asyncHandler(ctrl.index));
router.get('/export',        asyncHandler(ctrl.exportCsv));
router.get('/new',           requireRole('admin', 'staff'), ctrl.newForm);
router.post('/',             requireRole('admin', 'staff'), asyncHandler(ctrl.create));
router.get('/:id',           asyncHandler(ctrl.detail));
router.get('/:id/edit',      requireRole('admin', 'staff'), asyncHandler(ctrl.editForm));
router.put('/:id',           requireRole('admin', 'staff'), asyncHandler(ctrl.update));
router.delete('/:id',        requireRole('admin'), asyncHandler(ctrl.destroy));

module.exports = router;
