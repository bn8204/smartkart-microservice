const express  = require('express');
const router   = express.Router();
const ctrl     = require('../controllers/product.controller');
const validate = require('../middleware/validate');
const {
  paginationValidators, searchValidators, productIdParam,
  createProductValidators, updateStockValidators
} = require('../validators/product.validators');

/**
 * internalOnly — verifies the x-internal-secret header.
 * Only order-service should call PATCH /stock.
 */
function internalOnly(req, res, next) {
  const secret = process.env.INTERNAL_SERVICE_SECRET;
  if (!secret) {
    console.warn('[product-service] INTERNAL_SERVICE_SECRET not configured — skipping internal auth (dev mode)');
    return next();
  }
  if (req.headers['x-internal-secret'] !== secret) {
    return res.status(401).json({ success: false, message: 'Unauthorized: internal service access only' });
  }
  next();
}

// GET /v1/products           — list all (public, paginated)
router.get('/',            paginationValidators, validate, ctrl.getAll);

// GET /v1/products/search?q= — search by name/category (public)
router.get('/search',      searchValidators, validate, ctrl.search);

// GET /v1/products/:id       — get one (public)
router.get('/:id',         productIdParam, validate, ctrl.getById);

// POST /v1/products          — create (admin only, enforced at gateway)
router.post('/',           createProductValidators, validate, ctrl.create);

// PATCH /v1/products/:id/stock — internal service call only (order-service)
router.patch('/:id/stock', internalOnly, updateStockValidators, validate, ctrl.updateStock);

module.exports = router;

