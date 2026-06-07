'use strict';

const mongoose = require('mongoose');
const config   = require('./index');

/**
 * @module config/database
 * Encapsulates all MongoDB lifecycle logic.
 * Emits structured log lines so the container's stdout is easy to parse.
 */

let isConnected = false;

mongoose.connection.on('connected',    () => { isConnected = true;  log('connected'); });
mongoose.connection.on('disconnected', () => { isConnected = false; log('disconnected'); });
mongoose.connection.on('error',        (err) => log('error', err.message));

function log(event, detail = '') {
  const ts  = new Date().toISOString();
  const env = config.app.env;
  console.log(JSON.stringify({ ts, service: 'mongodb', event, env, detail }));
}

/**
 * Connect to MongoDB. Exits process on failure so K8s restarts the pod.
 */
async function connect() {
  if (isConnected) return;
  try {
    await mongoose.connect(config.db.uri, config.db.options);
  } catch (err) {
    log('fatal', err.message);
    process.exit(1);
  }
}

/**
 * Graceful disconnect — called on SIGTERM/SIGINT.
 */
async function disconnect() {
  if (!isConnected) return;
  await mongoose.connection.close();
  log('closed');
}

module.exports = { connect, disconnect, isConnected: () => isConnected };
