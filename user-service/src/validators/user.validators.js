'use strict';
const { body, param } = require('express-validator');

exports.registerValidators = [
  body('name')
    .trim().notEmpty().withMessage('name is required')
    .isLength({ min: 2, max: 100 }).withMessage('name must be 2–100 characters'),
  body('email')
    .trim().notEmpty().withMessage('email is required')
    .isEmail().withMessage('Must be a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('password is required')
    .isLength({ min: 6 }).withMessage('password must be at least 6 characters')
];

exports.loginValidators = [
  body('email')
    .trim().notEmpty().withMessage('email is required')
    .isEmail().withMessage('Must be a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('password is required')
];

exports.userIdParam = [
  param('id')
    .isInt({ min: 1 }).withMessage('User ID must be a positive integer')
    .toInt()
];
