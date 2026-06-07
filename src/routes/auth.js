'use strict';

const express  = require('express');
const router   = express.Router();
const ctrl     = require('../controllers/authController');
const asyncHandler = require('../utils/asyncHandler');
const { guestOnly } = require('../middleware/auth');

router.get('/',         (_req, res) => res.redirect('/dashboard'));
router.get('/login',    guestOnly, ctrl.showLogin);
router.post('/login',   guestOnly, asyncHandler(ctrl.login));
router.get('/register', guestOnly, ctrl.showRegister);
router.post('/register',guestOnly, asyncHandler(ctrl.register));
router.get('/logout',   ctrl.logout);

module.exports = router;
