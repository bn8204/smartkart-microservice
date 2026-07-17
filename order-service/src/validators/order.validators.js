'use strict';
const { body, param, query } = require('express-validator');

const VALID_SORTS       = ['created_at', 'total_amount', 'status'];
const VALID_ORDERS      = ['asc', 'desc'];
const VALID_STATUSES    = ['PENDING', 'CONFIRMED', 'FAILED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

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

exports.addToCartValidators = [
  body('user_id')
    .isInt({ min: 1 }).withMessage('user_id must be a positive integer').toInt(),
  body('product_id')
    .isInt({ min: 1 }).withMessage('product_id must be a positive integer').toInt(),
  body('quantity')
    .isInt({ min: 1 }).withMessage('quantity must be at least 1').toInt()
];

exports.checkoutValidators = [
  body('user_id')
    .isInt({ min: 1 }).withMessage('user_id must be a positive integer').toInt(),
  body('items')
    .isArray({ min: 1 }).withMessage('items must be a non-empty array'),
  body('items.*.product_id')
    .isInt({ min: 1 }).withMessage('Each item must have a valid product_id').toInt(),
  body('items.*.quantity')
    .isInt({ min: 1 }).withMessage('Each item quantity must be at least 1').toInt(),
  body('shipping_address').optional().trim()
    .isLength({ max: 500 }).withMessage('shipping_address must be at most 500 characters')
];

exports.updateStatusValidators = [
  param('id')
    .isInt({ min: 1 }).withMessage('Order ID must be a positive integer').toInt(),
  body('status')
    .notEmpty().withMessage('status is required')
    .isIn(VALID_STATUSES)
    .withMessage(`status must be one of: ${VALID_STATUSES.join(', ')}`)
];

exports.orderIdParam = [
  param('id')
    .isInt({ min: 1 }).withMessage('Order ID must be a positive integer').toInt()
];

exports.userIdParam = [
  param('userId')
    .isInt({ min: 1 }).withMessage('User ID must be a positive integer').toInt()
];

exports.cartItemIdParam = [
  param('itemId')
    .isInt({ min: 1 }).withMessage('Cart item ID must be a positive integer').toInt()
];
