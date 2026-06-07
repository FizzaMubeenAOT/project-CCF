'use strict';

/**
 * @module utils/paginate
 * Computes pagination metadata from query params + total count.
 *
 * @param {object} query      - Express req.query
 * @param {number} total      - Total documents matching the current filter
 * @param {number} [perPage]  - Items per page (falls back to config default)
 * @returns {PagerResult}
 *
 * @typedef {object} PagerResult
 * @property {number} page
 * @property {number} perPage
 * @property {number} skip
 * @property {number} total
 * @property {number} totalPages
 * @property {boolean} hasPrev
 * @property {boolean} hasNext
 * @property {number} prevPage
 * @property {number} nextPage
 */
function paginate(query, total, perPage = 12) {
  const page       = Math.max(1, parseInt(query.page, 10) || 1);
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const safePage   = Math.min(page, totalPages);

  return {
    page:       safePage,
    perPage,
    skip:       (safePage - 1) * perPage,
    total,
    totalPages,
    hasPrev:    safePage > 1,
    hasNext:    safePage < totalPages,
    prevPage:   safePage - 1,
    nextPage:   safePage + 1,
  };
}

module.exports = { paginate };
