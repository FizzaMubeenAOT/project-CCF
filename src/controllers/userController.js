'use strict';

const User = require('../models/User');

exports.index = async (req, res) => {
  const users = await User.find().select('-password').sort({ username: 1 }).lean();
  res.render('users/index', { users, title: 'Team & Roles' });
};

exports.updateRole = async (req, res) => {
  const { role } = req.body;
  if (!['admin', 'staff', 'viewer'].includes(role)) {
    req.session.flash = { type: 'error', message: 'Invalid role selected.' };
    return res.redirect('/users');
  }

  const target = await User.findById(req.params.id);
  if (!target) {
    req.session.flash = { type: 'error', message: 'User not found.' };
    return res.redirect('/users');
  }

  if (target._id.toString() === req.session.userId && role !== 'admin') {
    req.session.flash = { type: 'error', message: 'You cannot demote your own admin account.' };
    return res.redirect('/users');
  }

  target.role = role;
  await target.save();
  req.session.flash = { type: 'success', message: `${target.username} is now ${role}.` };
  res.redirect('/users');
};

exports.toggleActive = async (req, res) => {
  const target = await User.findById(req.params.id);
  if (!target) {
    req.session.flash = { type: 'error', message: 'User not found.' };
    return res.redirect('/users');
  }

  if (target._id.toString() === req.session.userId) {
    req.session.flash = { type: 'error', message: 'You cannot deactivate your own account.' };
    return res.redirect('/users');
  }

  target.isActive = !target.isActive;
  await target.save();
  req.session.flash = {
    type: 'success',
    message: `${target.username} ${target.isActive ? 'activated' : 'deactivated'}.`,
  };
  res.redirect('/users');
};
