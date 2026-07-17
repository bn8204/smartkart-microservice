'use strict';
const pkg = require('../../package.json');
const e = (desc) => ({ description: desc, content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } });
const v = { description: 'Validation failed', content: { 'application/json': { schema: { $ref: '#/components/schemas/ValidationError' } } } };
const PH = { 'X-Total-Count': { schema: { type: 'integer' } }, 'X-Page': { schema: { type: 'integer' } }, 'X-Limit': { schema: { type: 'integer' } }, 'X-Total-Pages': { schema: { type: 'integer' } } };
const pgQs = [
  { name: 'page',  in: 'query', schema: { type: 'integer', minimum: 1, default: 1 } },
  { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 } },
  { name: 'sort',  in: 'query', schema: { type: 'string', enum: ['created_at', 'amount', 'status'] } },
  { name: 'order', in: 'query', schema: { type: 'string', enum: ['asc', 'desc'] } }
];
const Payment = { type: 'object', properties: { id: { type: 'integer' }, order_id: { type: 'integer' }, user_id: { type: 'integer' }, amount: { type: 'string', example: '79.99' }, status: { type: 'string', enum: ['PENDING', 'SUCCESS', 'FAILED'] }, payment_method: { type: 'string', example: 'CARD' }, created_at: { type: 'string', format: 'date-time' } } };

module.exports = {
  openapi: '3.0.3',
  info: { title: 'SmartCart — Payment Service', description: 'Payment processing via Choreography Saga (RabbitMQ) and direct REST fallback. Append-only event log.', version: pkg.version || '1.0.0' },
  servers: [{ url: 'http://localhost:3004', description: 'Direct (dev)' }, { url: 'http://localhost:8080/api/v1/payments', description: 'Via API Gateway' }],
  tags: [{ name: 'Payments', description: 'Payment records and processing' }],
  components: {
    securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
    schemas: {
      Payment,
      Error: { type: 'object', properties: { success: { type: 'boolean', example: false }, message: { type: 'string' }, requestId: { type: 'string', format: 'uuid' } } },
      ValidationError: { type: 'object', properties: { success: { type: 'boolean', example: false }, message: { type: 'string', example: 'Validation failed' }, errors: { type: 'array', items: { type: 'object', properties: { field: { type: 'string' }, message: { type: 'string' }, value: {} } } } } }
    }
  },
  paths: {
    '/v1/payments/process': {
      post: {
        tags: ['Payments'], summary: 'Manually process a payment (REST fallback)', operationId: 'processPayment',
        description: '**REST fallback.** In normal flow, payments are created automatically by consuming `order.placed` events from RabbitMQ.',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['order_id', 'user_id', 'amount'], properties: { order_id: { type: 'integer', minimum: 1 }, user_id: { type: 'integer', minimum: 1 }, amount: { type: 'number', minimum: 0.01, example: 79.99 }, payment_method: { type: 'string', enum: ['CARD', 'UPI', 'NET_BANKING', 'WALLET', 'COD'], default: 'CARD' } } } } } },
        responses: { '201': { description: 'Payment created (SUCCESS)', content: { 'application/json': { schema: { $ref: '#/components/schemas/Payment' } } } }, '400': v }
      }
    },
    '/v1/payments/order/{orderId}': {
      get: {
        tags: ['Payments'], summary: 'Get payments for an order', operationId: 'getPaymentsByOrder',
        parameters: [{ name: 'orderId', in: 'path', required: true, schema: { type: 'integer', minimum: 1 } }],
        responses: { '200': { description: 'Payment records', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Payment' } } } } }, '400': v }
      }
    },
    '/v1/payments': {
      get: {
        tags: ['Payments'], summary: 'List all payments (paginated)', operationId: 'listPayments',
        parameters: pgQs,
        responses: { '200': { description: 'All payments', headers: PH, content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Payment' } } } } }, '400': v }
      }
    }
  }
};
