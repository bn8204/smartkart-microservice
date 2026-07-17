'use strict';
const pkg = require('../../package.json');

// Shared reusable schema fragments
const Schemas = {
  Error: {
    type: 'object',
    properties: {
      success:   { type: 'boolean', example: false },
      message:   { type: 'string',  example: 'Error description' },
      requestId: { type: 'string',  format: 'uuid' }
    }
  },
  ValidationError: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: false },
      message: { type: 'string',  example: 'Validation failed' },
      errors: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            field:   { type: 'string' },
            message: { type: 'string' },
            value:   {}
          }
        }
      }
    }
  },
  PaginationHeaders: {
    'X-Total-Count': { schema: { type: 'integer' }, description: 'Total number of records' },
    'X-Page':        { schema: { type: 'integer' }, description: 'Current page' },
    'X-Limit':       { schema: { type: 'integer' }, description: 'Page size' },
    'X-Total-Pages': { schema: { type: 'integer' }, description: 'Total pages' }
  },
  User: {
    type: 'object',
    properties: {
      id: { type: 'integer', example: 1 }, name: { type: 'string', example: 'Bob Smith' },
      email: { type: 'string', example: 'bob@example.com' },
      role: { type: 'string', enum: ['user', 'admin'] },
      created_at: { type: 'string', format: 'date-time' }
    }
  },
  Product: {
    type: 'object',
    properties: {
      id: { type: 'integer', example: 1 }, name: { type: 'string', example: 'Wireless Headphones' },
      description: { type: 'string' }, price: { type: 'number', example: 79.99 },
      stock: { type: 'integer', example: 50 }, category: { type: 'string', example: 'Electronics' },
      image_url: { type: 'string' }, created_at: { type: 'string', format: 'date-time' },
      updated_at: { type: 'string', format: 'date-time' }
    }
  },
  Order: {
    type: 'object',
    properties: {
      id: { type: 'integer', example: 1 }, user_id: { type: 'integer', example: 1 },
      total_amount: { type: 'string', example: '79.99' },
      status: { type: 'string', enum: ['PENDING', 'CONFIRMED', 'FAILED', 'SHIPPED', 'DELIVERED', 'CANCELLED'] },
      shipping_address: { type: 'string' },
      created_at: { type: 'string', format: 'date-time' },
      updated_at: { type: 'string', format: 'date-time' }
    }
  },
  Payment: {
    type: 'object',
    properties: {
      id: { type: 'integer', example: 1 }, order_id: { type: 'integer', example: 1 },
      user_id: { type: 'integer', example: 1 }, amount: { type: 'string', example: '79.99' },
      status: { type: 'string', enum: ['PENDING', 'SUCCESS', 'FAILED'] },
      payment_method: { type: 'string', example: 'CARD' },
      created_at: { type: 'string', format: 'date-time' }
    }
  }
};

const bearerAuth = [{ bearerAuth: [] }];
const errResp    = (desc) => ({ description: desc, content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } });
const valResp    = { description: 'Validation failed', content: { 'application/json': { schema: { $ref: '#/components/schemas/ValidationError' } } } };
const paginQs    = [
  { name: 'page',  in: 'query', schema: { type: 'integer', minimum: 1, default: 1 },   description: 'Page number' },
  { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 }, description: 'Items per page' },
  { name: 'sort',  in: 'query', schema: { type: 'string' }, description: 'Sort field' },
  { name: 'order', in: 'query', schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' }, description: 'Sort direction' }
];

module.exports = {
  openapi: '3.0.3',
  info: {
    title:       'SmartCart API Gateway',
    description: `Single entry point for all SmartCart microservices.\n\n**Authentication:** All protected routes require a Bearer JWT token.\nObtain one via \`POST /api/v1/auth/login\`.\n\n**Correlation ID:** Every response carries an \`X-Request-ID\` header for distributed tracing.`,
    version:     pkg.version || '1.0.0',
    contact:     { name: 'SmartCart Engineering' }
  },
  servers: [{ url: 'http://localhost:8080', description: 'Local development gateway' }],
  tags: [
    { name: 'Auth',     description: 'Registration and authentication' },
    { name: 'Products', description: 'Product catalog management' },
    { name: 'Orders',   description: 'Cart and order management' },
    { name: 'Payments', description: 'Payment processing and history' },
    { name: 'Meta',     description: 'Gateway health and service info' }
  ],
  components: {
    securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
    schemas: Schemas
  },
  paths: {
    '/health': {
      get: {
        tags: ['Meta'], summary: 'Gateway health check', operationId: 'gatewayHealth',
        description: 'Returns the health of the gateway and all upstream services.',
        responses: {
          '200': { description: 'All services healthy', content: { 'application/json': { example: { status: 'UP', service: 'api-gateway', version: '1.0.0', uptime: 3600, timestamp: '2026-07-05T12:00:00Z', checks: { 'user-service': 'UP', 'product-service': 'UP', 'order-service': 'UP', 'payment-service': 'UP' } } } } },
          '503': { description: 'One or more services degraded' }
        }
      }
    },
    '/api/v1': {
      get: {
        tags: ['Meta'], summary: 'Service map', operationId: 'serviceMap',
        responses: { '200': { description: 'Available API routes' } }
      }
    },
    '/api/v1/auth/register': {
      post: {
        tags: ['Auth'], summary: 'Register a new user', operationId: 'register',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', required: ['name', 'email', 'password'], properties: { name: { type: 'string', minLength: 2, example: 'Bob Smith' }, email: { type: 'string', format: 'email', example: 'bob@example.com' }, password: { type: 'string', minLength: 8, example: 'securePass123' } } } } }
        },
        responses: { '201': { description: 'Registered', content: { 'application/json': { schema: { type: 'object', properties: { user: { $ref: '#/components/schemas/User' }, token: { type: 'string' } } } } } }, '400': valResp, '409': errResp('Email already registered') }
      }
    },
    '/api/v1/auth/login': {
      post: {
        tags: ['Auth'], summary: 'Login', operationId: 'login',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', required: ['email', 'password'], properties: { email: { type: 'string', format: 'email' }, password: { type: 'string' } } } } }
        },
        responses: { '200': { description: 'Login successful', content: { 'application/json': { schema: { type: 'object', properties: { user: { $ref: '#/components/schemas/User' }, token: { type: 'string' } } } } } }, '400': valResp, '401': errResp('Invalid credentials') }
      }
    },
    '/api/v1/auth/users/{id}': {
      get: {
        tags: ['Auth'], summary: 'Get user by ID', operationId: 'getUserById', security: bearerAuth,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer', minimum: 1 } }],
        responses: { '200': { description: 'User found', content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } }, '401': errResp('Unauthorized'), '404': errResp('User not found') }
      }
    },
    '/api/v1/products': {
      get: {
        tags: ['Products'], summary: 'List all products', operationId: 'listProducts',
        description: 'Returns a paginated list of products. Pagination metadata is in response headers.',
        parameters: [...paginQs, { name: 'sort', in: 'query', schema: { type: 'string', enum: ['id', 'name', 'price', 'created_at'] } }],
        responses: { '200': { description: 'Product list', headers: Schemas.PaginationHeaders, content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Product' } } } } }, '400': valResp }
      },
      post: {
        tags: ['Products'], summary: 'Create a product (admin)', operationId: 'createProduct', security: bearerAuth,
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['name', 'price'], properties: { name: { type: 'string' }, description: { type: 'string' }, price: { type: 'number', minimum: 0 }, stock: { type: 'integer', minimum: 0 }, category: { type: 'string' }, image_url: { type: 'string' } } } } } },
        responses: { '201': { description: 'Product created', content: { 'application/json': { schema: { $ref: '#/components/schemas/Product' } } } }, '400': valResp, '401': errResp('Unauthorized'), '403': errResp('Admin access required') }
      }
    },
    '/api/v1/products/search': {
      get: {
        tags: ['Products'], summary: 'Search products', operationId: 'searchProducts',
        parameters: [{ name: 'q', in: 'query', schema: { type: 'string' }, description: 'Search term (name or category)' }],
        responses: { '200': { description: 'Matching products', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Product' } } } } } }
      }
    },
    '/api/v1/products/{id}': {
      get: {
        tags: ['Products'], summary: 'Get product by ID', operationId: 'getProductById',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer', minimum: 1 } }],
        responses: { '200': { description: 'Product found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Product' } } } }, '404': errResp('Product not found') }
      }
    },
    '/api/v1/orders/cart/items': {
      post: {
        tags: ['Orders'], summary: 'Add item to cart', operationId: 'addToCart', security: bearerAuth,
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['user_id', 'product_id', 'quantity'], properties: { user_id: { type: 'integer' }, product_id: { type: 'integer' }, quantity: { type: 'integer', minimum: 1 } } } } } },
        responses: { '200': { description: 'Item added/updated in cart' }, '400': valResp, '401': errResp('Unauthorized'), '404': errResp('Product not found') }
      }
    },
    '/api/v1/orders/cart/{userId}': {
      get: {
        tags: ['Orders'], summary: "Get user's cart", operationId: 'getCart', security: bearerAuth,
        parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'integer', minimum: 1 } }],
        responses: { '200': { description: 'Cart contents', content: { 'application/json': { example: { cartId: 1, items: [], total: '0.00' } } } }, '401': errResp('Unauthorized') }
      }
    },
    '/api/v1/orders/cart/items/{itemId}': {
      delete: {
        tags: ['Orders'], summary: 'Remove item from cart', operationId: 'removeCartItem', security: bearerAuth,
        parameters: [{ name: 'itemId', in: 'path', required: true, schema: { type: 'integer', minimum: 1 } }],
        responses: { '200': { description: 'Item removed' }, '401': errResp('Unauthorized') }
      }
    },
    '/api/v1/orders/checkout': {
      post: {
        tags: ['Orders'], summary: 'Checkout (create order)', operationId: 'checkout', security: bearerAuth,
        description: 'Creates an order. Prices are **fetched server-side** from product-service; client-supplied prices are ignored.',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['user_id', 'items'], properties: { user_id: { type: 'integer' }, shipping_address: { type: 'string' }, items: { type: 'array', minItems: 1, items: { type: 'object', required: ['product_id', 'quantity'], properties: { product_id: { type: 'integer', minimum: 1 }, quantity: { type: 'integer', minimum: 1 } } } } } } } } },
        responses: { '201': { description: 'Order created, payment Saga triggered', content: { 'application/json': { schema: { type: 'object', properties: { order: { $ref: '#/components/schemas/Order' }, total: { type: 'string' } } } } } }, '400': valResp, '401': errResp('Unauthorized'), '404': errResp('One or more products not found') }
      }
    },
    '/api/v1/orders': {
      get: {
        tags: ['Orders'], summary: 'List all orders', operationId: 'listOrders', security: bearerAuth,
        parameters: [...paginQs],
        responses: { '200': { description: 'Orders list', headers: Schemas.PaginationHeaders, content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Order' } } } } }, '401': errResp('Unauthorized') }
      }
    },
    '/api/v1/orders/my/{userId}': {
      get: {
        tags: ['Orders'], summary: "Get user's orders", operationId: 'getOrdersByUser', security: bearerAuth,
        parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'integer' } }, ...paginQs],
        responses: { '200': { description: "User's orders", headers: Schemas.PaginationHeaders, content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Order' } } } } }, '401': errResp('Unauthorized') }
      }
    },
    '/api/v1/orders/{id}': {
      get: {
        tags: ['Orders'], summary: 'Get order by ID', operationId: 'getOrderById', security: bearerAuth,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer', minimum: 1 } }],
        responses: { '200': { description: 'Order with items' }, '401': errResp('Unauthorized'), '404': errResp('Order not found') }
      }
    },
    '/api/v1/orders/{id}/status': {
      patch: {
        tags: ['Orders'], summary: 'Update order status', operationId: 'updateOrderStatus', security: bearerAuth,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer', minimum: 1 } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['status'], properties: { status: { type: 'string', enum: ['PENDING', 'CONFIRMED', 'FAILED', 'SHIPPED', 'DELIVERED', 'CANCELLED'] } } } } } },
        responses: { '200': { description: 'Status updated' }, '400': valResp, '401': errResp('Unauthorized'), '404': errResp('Order not found') }
      }
    },
    '/api/v1/orders/{id}/details': {
      get: {
        tags: ['Orders'], summary: 'Get order + payments in one call (API composition)', operationId: 'getOrderDetails', security: bearerAuth,
        description: 'Gateway-level composition: fetches order from order-service and payments from payment-service in parallel.',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer', minimum: 1 } }],
        responses: { '200': { description: 'Order with embedded payments', content: { 'application/json': { schema: { type: 'object', properties: { order: { $ref: '#/components/schemas/Order' }, payments: { type: 'array', items: { $ref: '#/components/schemas/Payment' } } } } } } }, '401': errResp('Unauthorized'), '404': errResp('Order not found') }
      }
    },
    '/api/v1/payments/process': {
      post: {
        tags: ['Payments'], summary: 'Manually process a payment (REST fallback)', operationId: 'processPayment', security: bearerAuth,
        description: 'REST fallback for creating a payment directly. In normal flow, payments are created automatically via the RabbitMQ Saga.',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['order_id', 'user_id', 'amount'], properties: { order_id: { type: 'integer' }, user_id: { type: 'integer' }, amount: { type: 'number', minimum: 0.01 }, payment_method: { type: 'string', enum: ['CARD', 'UPI', 'NET_BANKING', 'WALLET', 'COD'] } } } } } },
        responses: { '201': { description: 'Payment created' }, '400': valResp, '401': errResp('Unauthorized') }
      }
    },
    '/api/v1/payments/order/{orderId}': {
      get: {
        tags: ['Payments'], summary: 'Get payments for an order', operationId: 'getPaymentsByOrder', security: bearerAuth,
        parameters: [{ name: 'orderId', in: 'path', required: true, schema: { type: 'integer', minimum: 1 } }],
        responses: { '200': { description: 'Payment records', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Payment' } } } } }, '401': errResp('Unauthorized') }
      }
    },
    '/api/v1/payments': {
      get: {
        tags: ['Payments'], summary: 'List all payments', operationId: 'listPayments', security: bearerAuth,
        parameters: [...paginQs],
        responses: { '200': { description: 'Payments list', headers: Schemas.PaginationHeaders, content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Payment' } } } } }, '401': errResp('Unauthorized') }
      }
    }
  }
};
