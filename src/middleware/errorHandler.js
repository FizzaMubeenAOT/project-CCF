'use strict';

function notFound(req, res, next) {
  const err = Object.assign(new Error(`Not Found — ${req.originalUrl}`), { status: 404 });
  next(err);
}

function errorHandler(err, req, res, _next) {
  const status = err.status || 500;
  const isDev  = process.env.NODE_ENV !== 'production';
  const msg    = status < 500 ? err.message : 'An unexpected server error occurred.';

  console.error(`[ERROR] ${status} ${req.method} ${req.originalUrl} — ${err.message}`);
  if (isDev) console.error(err.stack);

  if (req.originalUrl.startsWith('/api')) {
    return res.status(status).json({ success: false, error: msg });
  }
  res.status(status).render('error', { code: status, message: msg, stack: isDev ? err.stack : null });
}

module.exports = { notFound, errorHandler };
