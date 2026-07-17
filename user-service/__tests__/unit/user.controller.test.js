'use strict';
/**
 * user-service — Unit tests: user.controller.js
 * Mocks pg pool, bcryptjs, jsonwebtoken so no live DB is required.
 */
process.env.NODE_ENV  = 'test';
process.env.JWT_SECRET = 'test-secret-key';

// ── Mock every module that touches external resources ─────────────────────────
jest.mock('../../src/db', () => ({ query: jest.fn(), end: jest.fn() }));
jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn(), http: jest.fn()
}));

const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const db     = require('../../src/db');
const ctrl   = require('../../src/controllers/user.controller');

// ── Helpers ───────────────────────────────────────────────────────────────────
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json   = jest.fn().mockReturnValue(res);
  return res;
};
const mockReq = (body = {}, params = {}) => ({ body, params, requestId: 'test-rid' });

// ── Test suites ───────────────────────────────────────────────────────────────
describe('User Controller — register()', () => {
  const validBody = { name: 'Alice Smith', email: 'alice@test.com', password: 'pass123' };

  beforeEach(() => jest.clearAllMocks());

  it('returns 201 with user and token on success', async () => {
    const mockUser = { id: 1, name: 'Alice Smith', email: 'alice@test.com', role: 'user', created_at: new Date() };
    jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed_pass');
    db.query.mockResolvedValue({ rows: [mockUser] });
    jest.spyOn(jwt, 'sign').mockReturnValue('fake-jwt');

    const res = mockRes();
    await ctrl.register(mockReq(validBody), res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ token: 'fake-jwt', user: mockUser }));
    expect(db.query).toHaveBeenCalledTimes(1);
  });

  it('returns 400 when name is missing', async () => {
    const res = mockRes();
    await ctrl.register(mockReq({ email: 'x@y.com', password: 'pass123' }), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(db.query).not.toHaveBeenCalled();
  });

  it('returns 400 when email is missing', async () => {
    const res = mockRes();
    await ctrl.register(mockReq({ name: 'Bob', password: 'pass123' }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 400 when password is missing', async () => {
    const res = mockRes();
    await ctrl.register(mockReq({ name: 'Bob', email: 'b@b.com' }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 409 on duplicate email (PG error 23505)', async () => {
    jest.spyOn(bcrypt, 'hash').mockResolvedValue('hash');
    db.query.mockRejectedValue({ code: '23505' });

    const res = mockRes();
    await ctrl.register(mockReq(validBody), res);
    expect(res.status).toHaveBeenCalledWith(409);
  });

  it('hashes password before storing', async () => {
    const mockUser = { id: 2, name: 'Alice Smith', email: 'alice@test.com', role: 'user', created_at: new Date() };
    const hashSpy = jest.spyOn(bcrypt, 'hash').mockResolvedValue('bcrypt_hash');
    db.query.mockResolvedValue({ rows: [mockUser] });
    jest.spyOn(jwt, 'sign').mockReturnValue('tok');

    await ctrl.register(mockReq(validBody), mockRes());
    expect(hashSpy).toHaveBeenCalledWith('pass123', 10);
    expect(db.query.mock.calls[0][1][2]).toBe('bcrypt_hash'); // params: [name, email, hash]
  });
});

describe('User Controller — login()', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 400 when email is missing', async () => {
    const res = mockRes();
    await ctrl.login(mockReq({ password: 'pass' }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 400 when password is missing', async () => {
    const res = mockRes();
    await ctrl.login(mockReq({ email: 'x@y.com' }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 401 for non-existent user', async () => {
    db.query.mockResolvedValue({ rows: [] });
    const res = mockRes();
    await ctrl.login(mockReq({ email: 'no@no.com', password: 'pass' }), res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Invalid credentials' }));
  });

  it('returns 401 for wrong password', async () => {
    db.query.mockResolvedValue({ rows: [{ id: 1, email: 'x@y.com', password: 'hash', role: 'user' }] });
    jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);
    const res = mockRes();
    await ctrl.login(mockReq({ email: 'x@y.com', password: 'wrong' }), res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns 200 with user and token for valid credentials', async () => {
    const mockUser = { id: 1, name: 'Bob', email: 'b@b.com', role: 'user', password: 'hash' };
    db.query.mockResolvedValue({ rows: [mockUser] });
    jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);
    jest.spyOn(jwt, 'sign').mockReturnValue('access-token');

    const res = mockRes();
    await ctrl.login(mockReq({ email: 'b@b.com', password: 'correct' }), res);

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ token: 'access-token' }));
    expect(res.status).not.toHaveBeenCalledWith(401);
  });
});

describe('User Controller — getById()', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 200 with user when found', async () => {
    const user = { id: 5, name: 'Carol', email: 'c@c.com', role: 'user' };
    db.query.mockResolvedValue({ rows: [user] });
    const res = mockRes();
    await ctrl.getById(mockReq({}, { id: 5 }), res);
    expect(res.json).toHaveBeenCalledWith(user);
  });

  it('returns 404 when user not found', async () => {
    db.query.mockResolvedValue({ rows: [] });
    const res = mockRes();
    await ctrl.getById(mockReq({}, { id: 999 }), res);
    expect(res.status).toHaveBeenCalledWith(404);
  });
});
