'use strict';

/** Redirect unauthenticated users to /login, saving the original URL. */
function requireAuth(req, res, next) {
  if (req.session?.userId) return next();
  req.session.returnTo = req.originalUrl;
  res.redirect('/login');
}

/** Redirect logged-in users away from auth pages. */
function guestOnly(req, res, next) {
  if (req.session?.userId) return res.redirect('/dashboard');
  next();
}

/** Role guard factory — requireRole('admin') */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.session?.userId) return res.redirect('/login');
    if (roles.includes(req.session.role)) return next();
    res.status(403).render('error', { code: 403, message: 'Forbidden — insufficient permissions.', stack: null });
  };
}

module.exports = { requireAuth, guestOnly, requireRole };
