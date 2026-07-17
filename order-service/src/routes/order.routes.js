const express  = require('express');
const router   = express.Router();
const ctrl     = require('../controllers/order.controller');
const validate = require('../middleware/validate');
const {
  paginationValidators, addToCartValidators, checkoutValidators,
  updateStatusValidators, orderIdParam, userIdParam, cartItemIdParam
} = require('../validators/order.validators');

// Cart operations
// POST /v1/orders/cart/items          — add item to cart
router.post('/cart/items',            addToCartValidators, validate, ctrl.addToCart);

// GET  /v1/orders/cart/:userId        — get user's cart
router.get('/cart/:userId',           userIdParam, validate, ctrl.getCart);

// DELETE /v1/orders/cart/items/:itemId — remove item from cart
router.delete('/cart/items/:itemId',  cartItemIdParam, validate, ctrl.removeCartItem);

// Order operations
// POST /v1/orders/checkout            — checkout (creates order + fires event)
router.post('/checkout',              checkoutValidators, validate, ctrl.checkout);

// GET  /v1/orders                     — list all orders (paginated)
router.get('/',                       paginationValidators, validate, ctrl.getAll);

// GET  /v1/orders/my/:userId          — get orders for a user (paginated)
router.get('/my/:userId',             userIdParam, paginationValidators, validate, ctrl.getByUser);

// GET  /v1/orders/:id                 — get single order with items
router.get('/:id',                    orderIdParam, validate, ctrl.getById);

// PATCH /v1/orders/:id/status         — update order status
router.patch('/:id/status',           updateStatusValidators, validate, ctrl.updateStatus);

module.exports = router;

