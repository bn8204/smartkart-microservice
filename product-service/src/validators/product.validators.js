'use strict';
const { body, param, query } = require('express-validator');

const VALID_SORTS   = ['id', 'name', 'price', 'created_at'];
const VALID_ORDERS  = ['asc', 'desc'];

exports.paginationValidators = [
  query('page').optional()
    .isInt({ min: 1 }).withMessage('page must be a positive integer').toInt(),
  query('limit').optional()
    .isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100').toInt(),
  query('sort').optional()
    .isIn(VALID_SORTS).withMessage(`sort must be one of: ${VALID_SORTS.join(', ')}`),
  query('order').optional()
    .isIn(VALID_ORDERS).withMessage('order must be asc or desc')
];

exports.searchValidators = [
  query('q').optional().trim()
    .isLength({ max: 200 }).withMessage('search query must be at most 200 characters')
];

exports.productIdParam = [
  param('id')
    .isInt({ min: 1 }).withMessage('Product ID must be a positive integer')
    .toInt()
];

exports.createProductValidators = [
  body('name')
    .trim().notEmpty().withMessage('name is required')
    .isLength({ min: 1, max: 255 }).withMessage('name must be 1–255 characters'),
  body('price')
    .notEmpty().withMessage('price is required')
    .isFloat({ min: 0 }).withMessage('price must be a non-negative number')
    .toFloat(),
  body('stock').optional()
    .isInt({ min: 0 }).withMessage('stock must be a non-negative integer')
    .toInt(),
  body('category').optional().trim()
    .isLength({ max: 100 }).withMessage('category must be at most 100 characters'),
  body('description').optional().trim(),
  body('image_url').optional().trim()
    .isURL().withMessage('image_url must be a valid URL')
];

exports.updateStockValidators = [
  param('id')
    .isInt({ min: 1 }).withMessage('Product ID must be a positive integer')
    .toInt(),
  body('delta')
    .notEmpty().withMessage('delta is required')
    .isInt().withMessage('delta must be an integer')
    .toInt()
];
