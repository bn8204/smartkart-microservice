const express  = require('express');
const router   = express.Router();
const ctrl     = require('../controllers/user.controller');
const validate = require('../middleware/validate');
const { registerValidators, loginValidators, userIdParam } = require('../validators/user.validators');

// POST /v1/auth/register
router.post('/register', registerValidators, validate, ctrl.register);

// POST /v1/auth/login
router.post('/login', loginValidators, validate, ctrl.login);

// GET /v1/auth/users/:id  (protected — gateway strips token, passes x-user-id header)
router.get('/users/:id', userIdParam, validate, ctrl.getById);

module.exports = router;

