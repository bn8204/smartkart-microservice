'use strict';
const { body, param, query } = require('express-validator');

const VALID_SORTS    = ['created_at', 'amount', 'status'];
const VALID_ORDERS   = ['asc', 'desc'];
const VALID_METHODS  = ['CARD', 'UPI', 'NET_BANKING', 'WALLET', 'COD'];

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

exports.processPaymentValidators = [
  body('order_id')
    .isInt({ min: 1 }).withMessage('order_id must be a positive integer').toInt(),
  body('user_id')
    .isInt({ min: 1 }).withMessage('user_id must be a positive integer').toInt(),
  body('amount')
    .isFloat({ min: 0.01 }).withMessage('amount must be greater than 0').toFloat(),
  body('payment_method').optional()
    .isIn(VALID_METHODS)
    .withMessage(`payment_method must be one of: ${VALID_METHODS.join(', ')}`)
];

exports.orderIdParam = [
  param('orderId')
    .isInt({ min: 1 }).withMessage('Order ID must be a positive integer').toInt()
];
