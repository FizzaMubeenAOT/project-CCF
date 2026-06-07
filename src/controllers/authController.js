'use strict';

const User = require('../models/User');

exports.showLogin = (_req, res) => {
  res.render('login', { error: null, prefill: '' });
};

exports.login = async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username: username?.trim() });

  if (!user || !user.isActive || !(await user.comparePassword(password))) {
    return res.render('login', { error: 'Invalid username or password.', prefill: username });
  }

  await user.recordLogin();
  req.session.userId   = user._id.toString();
  req.session.username = user.username;
  req.session.role     = user.role;
  req.session.initials = user.initials;

  const returnTo = req.session.returnTo || '/dashboard';
  delete req.session.returnTo;
  res.redirect(returnTo);
};

exports.showRegister = (_req, res) => {
  res.render('register', { error: null, formData: {} });
};

exports.register = async (req, res) => {
  const { username, email, password, confirmPassword } = req.body;

  if (password !== confirmPassword) {
    return res.render('register', { error: 'Passwords do not match.', formData: req.body });
  }
  if (password.length < 6) {
    return res.render('register', { error: 'Password must be at least 6 characters.', formData: req.body });
  }

  try {
    const user = await User.create({ username: username?.trim(), email, password, role: 'viewer' });
    req.session.userId   = user._id.toString();
    req.session.username = user.username;
    req.session.role     = user.role;
    req.session.initials = user.initials;
    req.session.flash    = { type: 'success', message: `Welcome, ${user.username}!` };
    res.redirect('/dashboard');
  } catch (err) {
    const msg = err.code === 11000 ? 'Username or email is already taken.' : 'Registration failed. Try again.';
    res.render('register', { error: msg, formData: req.body });
  }
};

exports.logout = (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
};
