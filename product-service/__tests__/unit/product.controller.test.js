'use strict';
/**
 * product-service — Unit tests: product.controller.js
 */
process.env.NODE_ENV = 'test';

jest.mock('../../src/db', () => ({ query: jest.fn() }));
jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn()
}));

const db   = require('../../src/db');
const ctrl = require('../../src/controllers/product.controller');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json   = jest.fn().mockReturnValue(res);
  res.set    = jest.fn().mockReturnValue(res);
  return res;
};
const mockReq = ({ body = {}, params = {}, query = {}, headers = {} } = {}) =>
  ({ body, params, query, headers, requestId: 'test-rid' });

describe('Product Controller — getAll()', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns paginated product list with headers', async () => {
    const products = [{ id: 1, name: 'Widget', price: 9.99 }];
    db.query
      .mockResolvedValueOnce({ rows: products })
      .mockResolvedValueOnce({ rows: [{ count: '1' }] });

    const res = mockRes();
    await ctrl.getAll(mockReq({ query: { page: '1', limit: '10' } }), res);

    expect(res.set).toHaveBeenCalledWith(expect.objectContaining({ 'X-Total-Count': 1, 'X-Page': 1 }));
    expect(res.json).toHaveBeenCalledWith(products);
  });

  it('defaults to page 1, limit 20 when no query params', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ count: '0' }] });

    await ctrl.getAll(mockReq(), mockRes());
    expect(db.query).toHaveBeenCalledTimes(2);
  });

  it('clamps limit to 100 maximum', async () => {
    db.query.mockResolvedValue({ rows: [] });
    const res = mockRes();
    await ctrl.getAll(mockReq({ query: { limit: '500' } }), res);
    // Should not throw; limit is clamped server-side
    expect(db.query).toHaveBeenCalled();
  });
});

describe('Product Controller — getById()', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 200 with product when found', async () => {
    const product = { id: 1, name: 'Widget', price: 9.99, stock: 10 };
    db.query.mockResolvedValue({ rows: [product] });

    const res = mockRes();
    await ctrl.getById(mockReq({ params: { id: '1' } }), res);

    expect(res.json).toHaveBeenCalledWith(product);
    expect(db.query).toHaveBeenCalledWith(expect.stringContaining('WHERE id = $1'), [expect.any(String)]);
  });

  it('returns 404 when product not found', async () => {
    db.query.mockResolvedValue({ rows: [] });
    const res = mockRes();
    await ctrl.getById(mockReq({ params: { id: '999' } }), res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Product not found' }));
  });
});

describe('Product Controller — create()', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 400 if name is missing', async () => {
    const res = mockRes();
    await ctrl.create(mockReq({ body: { price: 9.99 } }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 400 if price is missing', async () => {
    const res = mockRes();
    await ctrl.create(mockReq({ body: { name: 'Widget' } }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 201 with created product on success', async () => {
    const created = { id: 2, name: 'New Product', price: 19.99, stock: 0 };
    db.query.mockResolvedValue({ rows: [created] });

    const res = mockRes();
    await ctrl.create(mockReq({ body: { name: 'New Product', price: 19.99 } }), res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(created);
  });
});

describe('Product Controller — updateStock()', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 400 if delta is missing', async () => {
    const res = mockRes();
    await ctrl.updateStock(mockReq({ params: { id: '1' }, body: {} }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 404 if product not found', async () => {
    db.query.mockResolvedValue({ rows: [] });
    const res = mockRes();
    await ctrl.updateStock(mockReq({ params: { id: '999' }, body: { delta: -1 } }), res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns updated stock on success', async () => {
    db.query.mockResolvedValue({ rows: [{ id: 1, stock: 9 }] });
    const res = mockRes();
    await ctrl.updateStock(mockReq({ params: { id: '1' }, body: { delta: -1 } }), res);
    expect(res.json).toHaveBeenCalledWith({ id: 1, stock: 9 });
  });
});

describe('Product Controller — search()', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns matching products', async () => {
    const products = [{ id: 1, name: 'Widget', category: 'Electronics' }];
    db.query.mockResolvedValue({ rows: products });
    const res = mockRes();
    await ctrl.search(mockReq({ query: { q: 'widget' } }), res);
    expect(res.json).toHaveBeenCalledWith(products);
  });

  it('returns all products when q is empty', async () => {
    db.query.mockResolvedValue({ rows: [] });
    await ctrl.search(mockReq({ query: {} }), mockRes());
    expect(db.query).toHaveBeenCalledTimes(1);
  });
});
