'use strict';
/**
 * product-service — Integration tests via Supertest
 */
process.env.NODE_ENV  = 'test';
process.env.LOG_LEVEL = 'silent';

jest.mock('../../src/db', () => ({ query: jest.fn() }));
jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn()
}));
jest.mock('prom-client', () => {
  const reg = { contentType: 'text/plain', metrics: jest.fn().mockResolvedValue(''), setDefaultLabels: jest.fn() };
  return {
    Registry: jest.fn(() => reg),
    collectDefaultMetrics: jest.fn(),
    Histogram: jest.fn(() => ({ startTimer: jest.fn(() => jest.fn()) }))
  };
});

const request = require('supertest');
const db      = require('../../src/db');
const app     = require('../../src/server');

beforeEach(() => jest.clearAllMocks());

describe('GET /v1/products', () => {
  it('returns 200 with array of products', async () => {
    const products = [{ id: 1, name: 'Widget', price: 9.99, stock: 10 }];
    db.query
      .mockResolvedValueOnce({ rows: products })
      .mockResolvedValueOnce({ rows: [{ count: '1' }] });

    const res = await request(app).get('/v1/products');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].name).toBe('Widget');
    expect(res.headers['x-total-count']).toBe('1');
  });

  it('returns 200 with correct pagination headers', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ count: '50' }] });

    const res = await request(app).get('/v1/products?page=2&limit=10');

    expect(res.status).toBe(200);
    expect(res.headers['x-page']).toBe('2');
    expect(res.headers['x-limit']).toBe('10');
    expect(res.headers['x-total-count']).toBe('50');
    expect(res.headers['x-total-pages']).toBe('5');
  });

  it('returns 400 for invalid sort field', async () => {
    const res = await request(app).get('/v1/products?sort=evil_field;DROP TABLE');
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 for invalid page (zero)', async () => {
    const res = await request(app).get('/v1/products?page=0');
    expect(res.status).toBe(400);
  });

  it('returns 400 for limit exceeding 100', async () => {
    const res = await request(app).get('/v1/products?limit=500');
    expect(res.status).toBe(400);
  });
});

describe('GET /v1/products/:id', () => {
  it('returns 200 with product', async () => {
    db.query.mockResolvedValue({ rows: [{ id: 1, name: 'Widget', price: 9.99 }] });
    const res = await request(app).get('/v1/products/1');
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(1);
  });

  it('returns 404 when product does not exist', async () => {
    db.query.mockResolvedValue({ rows: [] });
    const res = await request(app).get('/v1/products/999');
    expect(res.status).toBe(404);
  });

  it('returns 400 for non-integer product ID', async () => {
    const res = await request(app).get('/v1/products/abc');
    expect(res.status).toBe(400);
  });
});

describe('GET /v1/products/search', () => {
  it('returns matching products', async () => {
    db.query.mockResolvedValue({ rows: [{ id: 1, name: 'Widget' }] });
    const res = await request(app).get('/v1/products/search?q=widget');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe('POST /v1/products', () => {
  it('returns 400 if name is missing', async () => {
    const res = await request(app)
      .post('/v1/products')
      .send({ price: 9.99 });
    expect(res.status).toBe(400);
  });

  it('returns 400 if price is negative', async () => {
    const res = await request(app)
      .post('/v1/products')
      .send({ name: 'Widget', price: -1 });
    expect(res.status).toBe(400);
  });

  it('returns 201 on valid product creation', async () => {
    db.query.mockResolvedValue({ rows: [{ id: 1, name: 'Widget', price: 9.99, stock: 0 }] });
    const res = await request(app)
      .post('/v1/products')
      .send({ name: 'Widget', price: 9.99 });
    expect(res.status).toBe(201);
  });
});

describe('GET /health', () => {
  it('returns 200 with database UP', async () => {
    db.query.mockResolvedValue({ rows: [{}] });
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.checks.database).toBe('UP');
  });
});
