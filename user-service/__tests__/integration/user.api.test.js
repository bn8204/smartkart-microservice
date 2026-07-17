'use strict';
/**
 * user-service — Integration tests via Supertest
 * All external dependencies are mocked; the real Express app is tested.
 */
process.env.NODE_ENV   = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.LOG_LEVEL  = 'silent';

// Mock everything that touches external resources
jest.mock('../../src/db', () => ({ query: jest.fn(), end: jest.fn() }));
jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn(), http: jest.fn()
}));
jest.mock('prom-client', () => {
  const reg = { contentType: 'text/plain', metrics: jest.fn().mockResolvedValue(''), setDefaultLabels: jest.fn() };
  return {
    Registry: jest.fn(() => reg),
    collectDefaultMetrics: jest.fn(),
    Histogram: jest.fn(() => ({ startTimer: jest.fn(() => jest.fn()), observe: jest.fn() }))
  };
});

const request = require('supertest');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const db      = require('../../src/db');
const app     = require('../../src/server');

beforeEach(() => jest.clearAllMocks());

// ── POST /v1/auth/register ────────────────────────────────────────────────────
describe('POST /v1/auth/register', () => {
  it('returns 201 with user and token for valid input', async () => {
    const mockUser = { id: 1, name: 'Bob', email: 'bob@test.com', role: 'user', created_at: new Date() };
    jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed');
    db.query.mockResolvedValue({ rows: [mockUser] });
    jest.spyOn(jwt, 'sign').mockReturnValue('access-token');

    const res = await request(app)
      .post('/v1/auth/register')
      .send({ name: 'Bob', email: 'bob@test.com', password: 'password123' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token', 'access-token');
    expect(res.body.user.email).toBe('bob@test.com');
  });

  it('returns 400 with validation errors for invalid email', async () => {
    const res = await request(app)
      .post('/v1/auth/register')
      .send({ name: 'Bob', email: 'not-an-email', password: 'password123' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors).toEqual(expect.arrayContaining([
      expect.objectContaining({ field: 'email' })
    ]));
  });

  it('returns 400 with validation error for short password', async () => {
    const res = await request(app)
      .post('/v1/auth/register')
      .send({ name: 'Bob', email: 'bob@test.com', password: 'abc' });

    expect(res.status).toBe(400);
    expect(res.body.errors).toEqual(expect.arrayContaining([
      expect.objectContaining({ field: 'password' })
    ]));
  });

  it('returns 400 when name is missing', async () => {
    const res = await request(app)
      .post('/v1/auth/register')
      .send({ email: 'bob@test.com', password: 'password123' });

    expect(res.status).toBe(400);
  });

  it('returns 409 when email is already registered', async () => {
    jest.spyOn(bcrypt, 'hash').mockResolvedValue('hash');
    db.query.mockRejectedValue({ code: '23505' });

    const res = await request(app)
      .post('/v1/auth/register')
      .send({ name: 'Bob', email: 'bob@test.com', password: 'password123' });

    expect(res.status).toBe(409);
  });
});

// ── POST /v1/auth/login ───────────────────────────────────────────────────────
describe('POST /v1/auth/login', () => {
  it('returns 200 with token for valid credentials', async () => {
    const mockUser = { id: 1, name: 'Bob', email: 'bob@test.com', role: 'user', password: 'hash' };
    db.query.mockResolvedValue({ rows: [mockUser] });
    jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);
    jest.spyOn(jwt, 'sign').mockReturnValue('login-token');

    const res = await request(app)
      .post('/v1/auth/login')
      .send({ email: 'bob@test.com', password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBe('login-token');
  });

  it('returns 401 for wrong credentials', async () => {
    db.query.mockResolvedValue({ rows: [] });

    const res = await request(app)
      .post('/v1/auth/login')
      .send({ email: 'bob@test.com', password: 'wrong' });

    expect(res.status).toBe(401);
  });

  it('returns 400 for missing email in login', async () => {
    const res = await request(app)
      .post('/v1/auth/login')
      .send({ password: 'pass123' });

    expect(res.status).toBe(400);
  });
});

// ── GET /health ───────────────────────────────────────────────────────────────
describe('GET /health', () => {
  it('returns 200 when DB is reachable', async () => {
    db.query.mockResolvedValue({ rows: [{ '?column?': 1 }] });

    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('UP');
    expect(res.body.checks.database).toBe('UP');
    expect(res.body).toHaveProperty('uptime');
    expect(res.body).toHaveProperty('version');
  });

  it('returns 503 when DB is down', async () => {
    db.query.mockRejectedValue(new Error('DB connection failed'));

    const res = await request(app).get('/health');

    expect(res.status).toBe(503);
    expect(res.body.status).toBe('DEGRADED');
    expect(res.body.checks.database).toBe('DOWN');
  });
});

// ── Security headers ──────────────────────────────────────────────────────────
describe('Security headers (Helmet)', () => {
  it('includes X-Frame-Options header', async () => {
    db.query.mockResolvedValue({ rows: [{}] });
    const res = await request(app).get('/health');
    expect(res.headers['x-frame-options']).toBeDefined();
  });

  it('includes X-Content-Type-Options header', async () => {
    db.query.mockResolvedValue({ rows: [{}] });
    const res = await request(app).get('/health');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });
});

// ── Correlation ID ────────────────────────────────────────────────────────────
describe('X-Request-ID correlation header', () => {
  it('generates X-Request-ID when not provided', async () => {
    db.query.mockResolvedValue({ rows: [{}] });
    const res = await request(app).get('/health');
    expect(res.headers['x-request-id']).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('propagates existing X-Request-ID', async () => {
    db.query.mockResolvedValue({ rows: [{}] });
    const myId = 'my-custom-request-id';
    const res  = await request(app).get('/health').set('X-Request-ID', myId);
    expect(res.headers['x-request-id']).toBe(myId);
  });
});
