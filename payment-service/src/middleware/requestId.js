'use strict';
const { randomUUID } = require('crypto');

/**
 * Assigns a unique X-Request-ID to every request.
 * If the upstream caller (e.g. API Gateway) already sent one, it is reused
 * so the same ID flows through the entire distributed call chain.
 */
function requestId(req, res, next) {
  const id = req.headers['x-request-id'] || randomUUID();
  req.requestId = id;
  res.setHeader('X-Request-ID', id);
  next();
}

module.exports = requestId;
