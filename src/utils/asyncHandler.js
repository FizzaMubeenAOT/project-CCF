'use strict';

/**
 * @module utils/asyncHandler
 * Wraps an async route handler so thrown errors are forwarded to Express's
 * error-handling middleware automatically. Removes try/catch from every controller.
 *
 * @param {Function} fn - Async route handler (req, res, next) => Promise
 * @returns {Function} Express-compatible middleware
 *
 * @example
 * router.get('/', asyncHandler(async (req, res) => {
 *   const data = await SomeModel.find();
 *   res.render('view', { data });
 * }));
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
