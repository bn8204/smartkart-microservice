'use strict';
const logger = require('../utils/logger');

// PostgreSQL error code → HTTP status + human message mapping
const PG_ERRORS = {
  '23505': { status: 409, message: 'Resource already exists (duplicate value)' },
  '23503': { status: 400, message: 'Referenced resource not found' },
  '23502': { status: 400, message: 'A required field is missing' },
  '22P02': { status: 400, message: 'Invalid input format' },
  '42P01': { status: 500, message: 'Database configuration error' }
};

/**
 * Global Express error handler.
 * Must be the LAST middleware registered (4-arg signature).
 *
 * Returns:
 *   { success: false, message: "...", requestId: "..." }
 * Stack traces are included only in non-production environments.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const isProd = process.env.NODE_ENV === 'production';

  let status  = err.status || err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Map PostgreSQL error codes to meaningful HTTP responses
  if (err.code && PG_ERRORS[err.code]) {
    ({ status, message } = PG_ERRORS[err.code]);
  }

  const meta = { requestId: req.requestId, method: req.method, path: req.path, status };

  if (status >= 500) {
    logger.error(message, { ...meta, stack: err.stack });
  } else {
    logger.warn(message, meta);
  }

  const body = { success: false, message, requestId: req.requestId };

  // Expose stack only in development to avoid information leakage
  if (!isProd && status >= 500 && err.stack) {
    body.stack = err.stack;
  }

  res.status(status).json(body);
}

module.exports = errorHandler;
