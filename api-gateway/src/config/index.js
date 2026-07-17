'use strict';
const pkg = require('../../package.json');

module.exports = {
  service: {
    name:    process.env.SERVICE_NAME || 'api-gateway',
    version: pkg.version             || '1.0.0',
    env:     process.env.NODE_ENV    || 'development',
    port:    Number(process.env.PORT) || 8080
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'smartcart_jwt_secret_key_2026',
    expiry: process.env.JWT_EXPIRY || '7d'
  },
  upstream: {
    userService:    process.env.USER_SERVICE_URL    || 'http://localhost:3001',
    productService: process.env.PRODUCT_SERVICE_URL || 'http://localhost:3002',
    orderService:   process.env.ORDER_SERVICE_URL   || 'http://localhost:3003',
    paymentService: process.env.PAYMENT_SERVICE_URL || 'http://localhost:3004'
  },
  cors: {
    origins: (process.env.CORS_ORIGINS || 'http://localhost:3000').split(',').map(s => s.trim())
  },
  log: {
    level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug')
  }
};
