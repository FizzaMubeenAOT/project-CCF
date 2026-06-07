'use strict';

const mongoose = require('mongoose');

/**
 * @module models/AuditLog
 * Immutable audit trail. Every student mutation writes a log entry.
 * Documents are intentionally never updated or deleted.
 */
const auditSchema = new mongoose.Schema({
  action:     { type: String, enum: ['CREATE', 'UPDATE', 'DELETE'], required: true },
  collection: { type: String, required: true },           // 'students'
  documentId: { type: mongoose.Schema.Types.ObjectId },   // affected record
  performedBy:{ type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  username:   { type: String },                           // denormalised for quick display
  diff:       { type: mongoose.Schema.Types.Mixed },      // before/after snapshot
  ip:         { type: String },
}, {
  timestamps: true,
  // Prevent accidental updates
  statics: {
    log({ action, collection, documentId, performedBy, username, diff, ip }) {
      return this.create({ action, collection, documentId, performedBy, username, diff, ip });
    }
  }
});

auditSchema.index({ documentId: 1 });
auditSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditSchema);
