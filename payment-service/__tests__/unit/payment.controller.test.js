'use strict';
/**
 * payment-service — Unit tests: payment.controller.js
 */
process.env.NODE_ENV = 'test';

jest.mock('../../src/db', () => ({ query: jest.fn() }));
jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn()
}));

const db   = require('../../src/db');
const ctrl = require('../../src/controllers/payment.controller');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json   = jest.fn().mockReturnValue(res);
  res.set    = jest.fn().mockReturnValue(res);
  return res;
};

describe('Payment Controller — processPayment()', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 400 when order_id is missing', async () => {
    const res = mockRes();
    await ctrl.processPayment({ body: { user_id: 1, amount: 10 } }, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(db.query).not.toHaveBeenCalled();
  });

  it('returns 400 when user_id is missing', async () => {
    const res = mockRes();
    await ctrl.processPayment({ body: { order_id: 1, amount: 10 } }, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 400 when amount is missing', async () => {
    const res = mockRes();
    await ctrl.processPayment({ body: { order_id: 1, user_id: 1 } }, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('creates payment record and returns 201', async () => {
    const payment = { id: 1, order_id: 1, user_id: 1, amount: '79.99', status: 'SUCCESS', payment_method: 'CARD', created_at: new Date() };
    db.query.mockResolvedValue({ rows: [payment] });

    const res = mockRes();
    await ctrl.processPayment({ body: { order_id: 1, user_id: 1, amount: 79.99, payment_method: 'CARD' } }, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(payment);
    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO payments'),
      expect.arrayContaining([1, 1, 79.99, 'SUCCESS', 'CARD'])
    );
  });

  it('defaults payment_method to CARD when not provided', async () => {
    db.query.mockResolvedValue({ rows: [{ id: 2 }] });
    const res = mockRes();
    await ctrl.processPayment({ body: { order_id: 1, user_id: 1, amount: 10 } }, res);
    expect(db.query.mock.calls[0][1]).toContain('CARD');
  });
});

describe('Payment Controller — getByOrder()', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns payments for a given order', async () => {
    const payments = [{ id: 1, order_id: 5, status: 'SUCCESS', amount: '100.00' }];
    db.query.mockResolvedValue({ rows: payments });
    const res = mockRes();
    await ctrl.getByOrder({ params: { orderId: '5' } }, res);
    expect(res.json).toHaveBeenCalledWith(payments);
    expect(db.query).toHaveBeenCalledWith(expect.stringContaining('WHERE order_id = $1'), ['5']);
  });

  it('returns empty array when no payments exist for order', async () => {
    db.query.mockResolvedValue({ rows: [] });
    const res = mockRes();
    await ctrl.getByOrder({ params: { orderId: '99' } }, res);
    expect(res.json).toHaveBeenCalledWith([]);
  });
});

describe('Payment Controller — getAll()', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns paginated payment list', async () => {
    const payments = [{ id: 1, status: 'SUCCESS', amount: '79.99' }];
    db.query
      .mockResolvedValueOnce({ rows: payments })
      .mockResolvedValueOnce({ rows: [{ count: '1' }] });

    const res = mockRes();
    await ctrl.getAll({ query: {} }, res);

    expect(res.set).toHaveBeenCalledWith(expect.objectContaining({ 'X-Total-Count': 1 }));
    expect(res.json).toHaveBeenCalledWith(payments);
  });
});
