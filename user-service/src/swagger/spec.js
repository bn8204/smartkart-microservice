'use strict';
const pkg = require('../../package.json');
const e = (desc) => ({ description: desc, content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } });
const v = { description: 'Validation failed', content: { 'application/json': { schema: { $ref: '#/components/schemas/ValidationError' } } } };

module.exports = {
  openapi: '3.0.3',
  info: { title: 'SmartCart — User Service', description: 'Authentication and user management. Handles registration, login and profile retrieval.', version: pkg.version || '1.0.0' },
  servers: [{ url: 'http://localhost:3001', description: 'Direct (dev)' }, { url: 'http://localhost:8080/api/v1/auth', description: 'Via API Gateway' }],
  tags: [{ name: 'Auth', description: 'Registration & login' }, { name: 'Users', description: 'User profiles' }],
  components: {
    securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
    schemas: {
      User: { type: 'object', properties: { id: { type: 'integer', example: 1 }, name: { type: 'string', example: 'Bob Smith' }, email: { type: 'string', example: 'bob@example.com' }, role: { type: 'string', enum: ['user', 'admin'] }, created_at: { type: 'string', format: 'date-time' } } },
      Error: { type: 'object', properties: { success: { type: 'boolean', example: false }, message: { type: 'string' }, requestId: { type: 'string', format: 'uuid' } } },
      ValidationError: { type: 'object', properties: { success: { type: 'boolean', example: false }, message: { type: 'string', example: 'Validation failed' }, errors: { type: 'array', items: { type: 'object', properties: { field: { type: 'string' }, message: { type: 'string' }, value: {} } } } } }
    }
  },
  paths: {
    '/v1/auth/register': {
      post: {
        tags: ['Auth'], summary: 'Register a new user', operationId: 'register',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['name', 'email', 'password'], properties: { name: { type: 'string', minLength: 2, example: 'Bob Smith' }, email: { type: 'string', format: 'email', example: 'bob@example.com' }, password: { type: 'string', minLength: 8, example: 'securePass123' } } } } } },
        responses: { '201': { description: 'User registered', content: { 'application/json': { schema: { type: 'object', properties: { user: { $ref: '#/components/schemas/User' }, token: { type: 'string' } } } } } }, '400': v, '409': e('Email already registered') }
      }
    },
    '/v1/auth/login': {
      post: {
        tags: ['Auth'], summary: 'Login with email and password', operationId: 'login',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['email', 'password'], properties: { email: { type: 'string', format: 'email' }, password: { type: 'string' } } } } } },
        responses: { '200': { description: 'Login successful', content: { 'application/json': { schema: { type: 'object', properties: { user: { $ref: '#/components/schemas/User' }, token: { type: 'string' } } } } } }, '400': v, '401': e('Invalid credentials') }
      }
    },
    '/v1/auth/users/{id}': {
      get: {
        tags: ['Users'], summary: 'Get user by ID', operationId: 'getUserById', security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer', minimum: 1 }, description: 'User ID' }],
        responses: { '200': { description: 'User found', content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } }, '400': v, '401': e('Unauthorized'), '404': e('User not found') }
      }
    }
  }
};
