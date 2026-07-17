'use strict';
/**
 * order-service — Unit tests: order.controller.js
 * Key focus: checkout price-fetch security, cart upsert, pagination
 */
process.env.NODE_ENV          = 'test';
process.env.PRODUCT_SERVICE_URL = 'http://mock-product:3002';

jest.mock('../../src/db', () => ({ query: jest.fn(), connect: jest.fn() }));
jest.mock('../../src/publisher', () => ({
  publishOrderPlaced: jest.fn().mockResolvedValue(undefined),
  connect: jest.fn(), close: jest.fn()
}));
jest.mock('axios');
jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn()
}));

const axios     = require('axios');
const db        = require('../../src/db');
const publisher = require('../../src/publisher');
const ctrl      = require('../../src/controllers/order.controller');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json   = jest.fn().mockReturnValue(res);
  res.set    = jest.fn().mockReturnValue(res);
  return res;
};

// Build a mock PG client for transaction tests
const buildMockClient = (orderRow) => {
  const client = {
    query: jest.fn(),
    release: jest.fn()
  };
  client.query
    .mockResolvedValueOnce({})                            // BEGIN
    .mockResolvedValueOnce({ rows: [orderRow] })          // INSERT order
    .mockResolvedValueOnce({})                            // INSERT order_item
    .mockResolvedValueOnce({ rows: [] })                  // SELECT cart
    .mockResolvedValueOnce({});                           // COMMIT
  return client;
};

describe('Order Controller — checkout()', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 400 when user_id is missing', async () => {
    const res = mockRes();
    await ctrl.checkout({ body: { items: [{ product_id: 1, quantity: 1 }] } }, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(axios.get).not.toHaveBeenCalled();
  });

  it('returns 400 when items array is empty', async () => {
    const res = mockRes();
    await ctrl.checkout({ body: { user_id: 1, items: [] } }, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('fetches authoritative price from product-service (prevents client price injection)', async () => {
    axios.get.mockResolvedValue({ data: { name: 'Widget', price: 49.99 } });
    axios.patch.mockResolvedValue({});
    const orderRow = { id: 1, user_id: 1, total_amount: '49.99', status: 'PENDING', shipping_address: null, created_at: new Date(), updated_at: new Date() };
    db.connect.mockResolvedValue(buildMockClient(orderRow));

    const req = { body: { user_id: 1, items: [{ product_id: 1, quantity: 1 }] } };
    const res = mockRes();
    await ctrl.checkout(req, res);

    // Verify it fetched the price — not taken from body
    expect(axios.get).toHaveBeenCalledWith('http://mock-product:3002/v1/products/1', { timeout: 5000 });
    expect(res.status).toHaveBeenCalledWith(201);
    // Total must be server-calculated (1 × 49.99)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ total: '49.99' }));
  });

  it('ignores client-supplied unit_price — uses server price', async () => {
    // Client sends unit_price=0.01 (price manipulation attempt)
    axios.get.mockResolvedValue({ data: { name: 'Expensive', price: 999.00 } });
    axios.patch.mockResolvedValue({});
    const orderRow = { id: 2, user_id: 1, total_amount: '999.00', status: 'PENDING', shipping_address: null, created_at: new Date(), updated_at: new Date() };
    db.connect.mockResolvedValue(buildMockClient(orderRow));

    const req = { body: { user_id: 1, items: [{ product_id: 1, quantity: 1, unit_price: 0.01 }] } };
    const res = mockRes();
    await ctrl.checkout(req, res);

    // Must use 999.00 not 0.01
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ total: '999.00' }));
  });

  it('returns 404 when product-service returns 404', async () => {
    axios.get.mockRejectedValue({ response: { status: 404 } });
    const res = mockRes();
    await ctrl.checkout({ body: { user_id: 1, items: [{ product_id: 99, quantity: 1 }] } }, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 502 when product-service is unreachable', async () => {
    axios.get.mockRejectedValue(new Error('ECONNREFUSED'));
    const res = mockRes();
    await ctrl.checkout({ body: { user_id: 1, items: [{ product_id: 1, quantity: 1 }] } }, res);
    expect(res.status).toHaveBeenCalledWith(502);
  });

  it('publishes order.placed event after successful checkout', async () => {
    axios.get.mockResolvedValue({ data: { name: 'Widget', price: 10.00 } });
    axios.patch.mockResolvedValue({});
    const orderRow = { id: 3, user_id: 1, total_amount: '10.00', status: 'PENDING', shipping_address: null, created_at: new Date(), updated_at: new Date() };
    db.connect.mockResolvedValue(buildMockClient(orderRow));

    await ctrl.checkout({ body: { user_id: 1, items: [{ product_id: 1, quantity: 1 }] } }, mockRes());

    expect(publisher.publishOrderPlaced).toHaveBeenCalledWith(expect.objectContaining({
      orderId: 3, userId: 1, amount: '10.00'
    }));
  });
});

describe('Order Controller — getAll()', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns paginated orders', async () => {
    const orders = [{ id: 1, status: 'CONFIRMED' }];
    db.query
      .mockResolvedValueOnce({ rows: orders })
      .mockResolvedValueOnce({ rows: [{ count: '1' }] });

    const res = mockRes();
    await ctrl.getAll({ query: {} }, res);

    expect(res.set).toHaveBeenCalledWith(expect.objectContaining({ 'X-Total-Count': 1 }));
    expect(res.json).toHaveBeenCalledWith(orders);
  });
});

describe('Order Controller — addToCart()', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 400 when required fields are missing', async () => {
    const res = mockRes();
    await ctrl.addToCart({ body: { user_id: 1 } }, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 404 when product does not exist', async () => {
    axios.get.mockRejectedValue({ response: { status: 404 } });
    const res = mockRes();
    await ctrl.addToCart({ body: { user_id: 1, product_id: 99, quantity: 1 } }, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });
});
