'use strict';
const pkg = require('../../package.json');
const e = (desc) => ({ description: desc, content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } });
const v = { description: 'Validation failed', content: { 'application/json': { schema: { $ref: '#/components/schemas/ValidationError' } } } };
const PH = { 'X-Total-Count': { schema: { type: 'integer' } }, 'X-Page': { schema: { type: 'integer' } }, 'X-Limit': { schema: { type: 'integer' } }, 'X-Total-Pages': { schema: { type: 'integer' } } };
const pgQs = [
  { name: 'page',  in: 'query', schema: { type: 'integer', minimum: 1, default: 1 } },
  { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 } },
  { name: 'sort',  in: 'query', schema: { type: 'string', enum: ['id', 'name', 'price', 'created_at'] } },
  { name: 'order', in: 'query', schema: { type: 'string', enum: ['asc', 'desc'] } }
];

module.exports = {
  openapi: '3.0.3',
  info: { title: 'SmartCart — Product Service', description: 'Product catalog CRUD and stock management.', version: pkg.version || '1.0.0' },
  servers: [{ url: 'http://localhost:3002', description: 'Direct (dev)' }, { url: 'http://localhost:8080/api/v1/products', description: 'Via API Gateway' }],
  tags: [{ name: 'Products', description: 'Product catalog' }],
  components: {
    securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
    schemas: {
      Product: { type: 'object', properties: { id: { type: 'integer', example: 1 }, name: { type: 'string', example: 'Wireless Headphones' }, description: { type: 'string' }, price: { type: 'number', example: 79.99 }, stock: { type: 'integer', example: 50 }, category: { type: 'string', example: 'Electronics' }, image_url: { type: 'string' }, created_at: { type: 'string', format: 'date-time' }, updated_at: { type: 'string', format: 'date-time' } } },
      Error: { type: 'object', properties: { success: { type: 'boolean', example: false }, message: { type: 'string' }, requestId: { type: 'string', format: 'uuid' } } },
      ValidationError: { type: 'object', properties: { success: { type: 'boolean', example: false }, message: { type: 'string', example: 'Validation failed' }, errors: { type: 'array', items: { type: 'object', properties: { field: { type: 'string' }, message: { type: 'string' }, value: {} } } } } }
    }
  },
  paths: {
    '/v1/products': {
      get: {
        tags: ['Products'], summary: 'List all products', operationId: 'listProducts',
        description: 'Paginated product list. Metadata in response headers (X-Total-Count, X-Page, etc.).',
        parameters: pgQs,
        responses: { '200': { description: 'Product list', headers: PH, content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Product' } } } } }, '400': v }
      },
      post: {
        tags: ['Products'], summary: 'Create product (admin)', operationId: 'createProduct', security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['name', 'price'], properties: { name: { type: 'string', example: 'New Product' }, description: { type: 'string' }, price: { type: 'number', minimum: 0, example: 19.99 }, stock: { type: 'integer', minimum: 0, default: 0 }, category: { type: 'string' }, image_url: { type: 'string' } } } } } },
        responses: { '201': { description: 'Product created', content: { 'application/json': { schema: { $ref: '#/components/schemas/Product' } } } }, '400': v, '401': e('Unauthorized'), '403': e('Admin access required') }
      }
    },
    '/v1/products/search': {
      get: {
        tags: ['Products'], summary: 'Search products by name or category', operationId: 'searchProducts',
        parameters: [{ name: 'q', in: 'query', schema: { type: 'string' }, description: 'Search term' }],
        responses: { '200': { description: 'Matching products', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Product' } } } } } }
      }
    },
    '/v1/products/{id}': {
      get: {
        tags: ['Products'], summary: 'Get product by ID', operationId: 'getProductById',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer', minimum: 1 } }],
        responses: { '200': { description: 'Product found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Product' } } } }, '400': v, '404': e('Product not found') }
      }
    },
    '/v1/products/{id}/stock': {
      patch: {
        tags: ['Products'], summary: 'Update stock (internal — order-service only)', operationId: 'updateStock', security: [{ bearerAuth: [] }],
        description: '**Internal endpoint.** Requires `x-internal-secret` header. Increments or decrements stock by `delta`.',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer', minimum: 1 } }, { name: 'x-internal-secret', in: 'header', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['delta'], properties: { delta: { type: 'integer', example: -1, description: 'Negative to decrement, positive to increment' } } } } } },
        responses: { '200': { description: 'Stock updated', content: { 'application/json': { example: { id: 1, stock: 49 } } } }, '400': v, '401': e('Unauthorized'), '404': e('Product not found') }
      }
    }
  }
};
