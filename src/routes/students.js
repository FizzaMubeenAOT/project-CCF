'use strict';

const express  = require('express');
const router   = express.Router();
const ctrl     = require('../controllers/studentController');
const asyncHandler  = require('../utils/asyncHandler');
const { requireAuth } = require('../middleware/auth');

// All student routes require authentication
router.use(requireAuth);

router.get('/',              asyncHandler(ctrl.index));
router.get('/new',           ctrl.newForm);
router.post('/',             asyncHandler(ctrl.create));
router.get('/:id',           asyncHandler(ctrl.detail));
router.get('/:id/edit',      asyncHandler(ctrl.editForm));
router.put('/:id',           asyncHandler(ctrl.update));
router.delete('/:id',        asyncHandler(ctrl.destroy));

module.exports = router;
