'use strict';

/**
 * @file app.js
 * Application entry point. Wires together:
 *   - Security middleware (helmet, rate-limit, CSRF-ready sessions)
 *   - Request parsing + method-override
 *   - Session store (MongoDB-backed)
 *   - View engine (EJS)
 *   - Route modules
 *   - Error handlers
 *   - Graceful shutdown (SIGTERM/SIGINT)
 */

const express        = require('express');
const session        = require('express-session');
const MongoStore     = require('connect-mongo');
const helmet         = require('helmet');
const morgan         = require('morgan');
const methodOverride = require('method-override');
const rateLimit      = require('express-rate-limit');
const path           = require('path');

const config   = require('./config');
const db       = require('./config/database');

// ─── Bootstrap ────────────────────────────────────────────────────────────────
const app = express();
db.connect();  // connects + sets up lifecycle event logging

// ─── Security ─────────────────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc:   ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc:    ["'self'", 'https://fonts.gstatic.com'],
      scriptSrc:  ["'self'", "'unsafe-inline'"],
      imgSrc:     ["'self'", 'data:'],
    },
  },
}));

app.use('/login',    rateLimit({ ...config.rateLimit.auth, message: 'Too many attempts. Try again later.' }));
app.use('/register', rateLimit({ ...config.rateLimit.auth, message: 'Too many attempts. Try again later.' }));

// ─── Request parsing ──────────────────────────────────────────────────────────
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));  // enables PUT/DELETE from HTML forms via ?_method=
app.use(express.static(path.join(__dirname, '../public')));

// ─── Logging ──────────────────────────────────────────────────────────────────
app.use(morgan(config.app.env === 'production' ? 'combined' : 'dev'));

// ─── Sessions (persisted in MongoDB) ─────────────────────────────────────────
app.use(session({
  secret:            config.app.secret,
  resave:            false,
  saveUninitialized: false,
  store:             MongoStore.create({ mongoUrl: config.db.uri, ttl: 3600 }),
  cookie: {
    maxAge:   3600 * 1000,
    httpOnly: true,
    secure:   config.app.env === 'production',
    sameSite: 'lax',
  },
}));

// ─── View engine ──────────────────────────────────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ─── Template globals (available in every EJS template) ───────────────────────
app.use((req, res, next) => {
  res.locals.currentUser = req.session.username || null;
  res.locals.userRole    = req.session.role     || null;
  res.locals.initials    = req.session.initials || '??';
  res.locals.flash       = req.session.flash    || null;
  res.locals.appName     = config.app.name;
  delete req.session.flash;
  next();
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/',         require('./routes/auth'));
app.use('/dashboard',require('./routes/dashboard'));
app.use('/students', require('./routes/students'));
app.use('/api',      require('./routes/api'));

// Kubernetes probes (unauthenticated)
app.get('/health', (_req, res) => res.json({ status: 'ok', uptime: process.uptime() }));
app.get('/ready',  (_req, res) => {
  if (db.isConnected()) return res.json({ status: 'ready' });
  res.status(503).json({ status: 'not_ready', db: 'disconnected' });
});

// ─── Error handling ───────────────────────────────────────────────────────────
const { notFound, errorHandler } = require('./middleware/errorHandler');
app.use(notFound);
app.use(errorHandler);

// ─── Start ────────────────────────────────────────────────────────────────────
const server = app.listen(config.app.port, () => {
  console.log(`🚀  EduTrack v3 → http://localhost:${config.app.port}  [${config.app.env}]`);
});

// ─── Graceful shutdown ─────────────────────────────────────────────────────────
async function shutdown(signal) {
  console.log(`\n⚡  ${signal} received — shutting down gracefully…`);
  server.close(async () => {
    await db.disconnect();
    console.log('✅  Server closed. Goodbye.');
    process.exit(0);
  });
  // Force exit after 10s if connections don't drain
  setTimeout(() => { console.error('⚠️  Forced exit'); process.exit(1); }, 10_000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

module.exports = app;
