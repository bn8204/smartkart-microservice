'use strict';
const { validationResult } = require('express-validator');

/**
 * Runs after express-validator chains and returns a standardised 400 if
 * any validation rule was violated.
 *
 * Error shape:
 *   { success: false, message: "Validation failed", errors: [...] }
 */
function validate(req, res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  return res.status(400).json({
    success: false,
    message: 'Validation failed',
    errors:  result.array().map(e => ({
      field:   e.path,
      message: e.msg,
      value:   e.value
    }))
  });
}

module.exports = validate;
