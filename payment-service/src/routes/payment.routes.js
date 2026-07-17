const express  = require('express');
const router   = express.Router();
const ctrl     = require('../controllers/payment.controller');
const validate = require('../middleware/validate');
const {
  paginationValidators, processPaymentValidators, orderIdParam
} = require('../validators/payment.validators');

// POST /v1/payments/process           — manually trigger payment (REST fallback)
router.post('/process',               processPaymentValidators, validate, ctrl.processPayment);

// GET  /v1/payments/order/:orderId    — get payment status for an order
router.get('/order/:orderId',         orderIdParam, validate, ctrl.getByOrder);

// GET  /v1/payments                   — list all payments (paginated)
router.get('/',                       paginationValidators, validate, ctrl.getAll);

module.exports = router;

