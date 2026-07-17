'use strict';
const pkg = require('../../package.json');
const e = (desc) => ({ description: desc, content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } });
const v = { description: 'Validation failed', content: { 'application/json': { schema: { $ref: '#/components/schemas/ValidationError' } } } };
const PH = { 'X-Total-Count': { schema: { type: 'integer' } }, 'X-Page': { schema: { type: 'integer' } }, 'X-Limit': { schema: { type: 'integer' } }, 'X-Total-Pages': { schema: { type: 'integer' } } };
const pgQs = [
  { name: 'page',  in: 'query', schema: { type: 'integer', minimum: 1, default: 1 } },
  { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 } },
  { name: 'sort',  in: 'query', schema: { type: 'string', enum: ['created_at', 'total_amount', 'status'] } },
  { name: 'order', in: 'query', schema: { type: 'string', enum: ['asc', 'desc'] } }
];
const STATUSES = ['PENDING', 'CONFIRMED', 'FAILED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
const Order = { type: 'object', properties: { id: { type: 'integer' }, user_id: { type: 'integer' }, total_amount: { type: 'string', example: '79.99' }, status: { type: 'string', enum: STATUSES }, shipping_address: { type: 'string' }, created_at: { type: 'string', format: 'date-time' }, updated_at: { type: 'string', format: 'date-time' } } };

module.exports = {
  openapi: '3.0.3',
  info: { title: 'SmartCart — Order Service', description: 'Cart management, checkout, order lifecycle and Choreography Saga publisher.', version: pkg.version || '1.0.0' },
  servers: [{ url: 'http://localhost:3003', description: 'Direct (dev)' }, { url: 'http://localhost:8080/api/v1/orders', description: 'Via API Gateway' }],
  tags: [{ name: 'Cart', description: 'Shopping cart operations' }, { name: 'Orders', description: 'Order lifecycle' }],
  components: {
    securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
    schemas: {
      Order,
      Error: { type: 'object', properties: { success: { type: 'boolean', example: false }, message: { type: 'string' }, requestId: { type: 'string', format: 'uuid' } } },
      ValidationError: { type: 'object', properties: { success: { type: 'boolean', example: false }, message: { type: 'string', example: 'Validation failed' }, errors: { type: 'array', items: { type: 'object', properties: { field: { type: 'string' }, message: { type: 'string' }, value: {} } } } } }
    }
  },
  paths: {
    '/v1/orders/cart/items': {
      post: {
        tags: ['Cart'], summary: 'Add item to cart (upsert)', operationId: 'addToCart',
        description: 'If the product is already in the cart, its quantity is incremented rather than creating a duplicate row.',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['user_id', 'product_id', 'quantity'], properties: { user_id: { type: 'integer', minimum: 1 }, product_id: { type: 'integer', minimum: 1 }, quantity: { type: 'integer', minimum: 1, example: 2 } } } } } },
        responses: { '200': { description: 'Cart item added/updated' }, '400': v, '404': e('Product not found') }
      }
    },
    '/v1/orders/cart/{userId}': {
      get: {
        tags: ['Cart'], summary: "Get user's cart", operationId: 'getCart',
        parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'integer', minimum: 1 } }],
        responses: { '200': { description: 'Cart contents', content: { 'application/json': { example: { cartId: 1, items: [{ id: 1, product_id: 1, quantity: 2, unit_price: '79.99' }], total: '159.98' } } } } }
      }
    },
    '/v1/orders/cart/items/{itemId}': {
      delete: {
        tags: ['Cart'], summary: 'Remove item from cart', operationId: 'removeCartItem',
        parameters: [{ name: 'itemId', in: 'path', required: true, schema: { type: 'integer', minimum: 1 } }],
        responses: { '200': { description: 'Item removed' }, '400': v }
      }
    },
    '/v1/orders/checkout': {
      post: {
        tags: ['Orders'], summary: 'Checkout — create order and start payment Saga', operationId: 'checkout',
        description: 'Fetches authoritative prices server-side. Publishes `order.placed` to RabbitMQ for payment-service.',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['user_id', 'items'], properties: { user_id: { type: 'integer', minimum: 1 }, shipping_address: { type: 'string' }, items: { type: 'array', minItems: 1, items: { type: 'object', required: ['product_id', 'quantity'], properties: { product_id: { type: 'integer', minimum: 1 }, quantity: { type: 'integer', minimum: 1 } } } } } } } } },
        responses: { '201': { description: 'Order created, Saga triggered', content: { 'application/json': { schema: { type: 'object', properties: { order: { $ref: '#/components/schemas/Order' }, total: { type: 'string' } } } } } }, '400': v, '404': e('One or more products not found'), '502': e('Could not reach product-service') }
      }
    },
    '/v1/orders': {
      get: {
        tags: ['Orders'], summary: 'List all orders (paginated)', operationId: 'listOrders',
        parameters: pgQs,
        responses: { '200': { description: 'Orders', headers: PH, content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Order' } } } } }, '400': v }
      }
    },
    '/v1/orders/my/{userId}': {
      get: {
        tags: ['Orders'], summary: "Get user's orders (paginated)", operationId: 'getOrdersByUser',
        parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'integer', minimum: 1 } }, ...pgQs],
        responses: { '200': { description: "User's orders", headers: PH, content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Order' } } } } }, '400': v }
      }
    },
    '/v1/orders/{id}': {
      get: {
        tags: ['Orders'], summary: 'Get order with items', operationId: 'getOrderById',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer', minimum: 1 } }],
        responses: { '200': { description: 'Order with items array' }, '400': v, '404': e('Order not found') }
      }
    },
    '/v1/orders/{id}/status': {
      patch: {
        tags: ['Orders'], summary: 'Update order status', operationId: 'updateOrderStatus',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer', minimum: 1 } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['status'], properties: { status: { type: 'string', enum: STATUSES } } } } } },
        responses: { '200': { description: 'Status updated', content: { 'application/json': { schema: { $ref: '#/components/schemas/Order' } } } }, '400': v, '404': e('Order not found') }
      }
    }
  }
};
