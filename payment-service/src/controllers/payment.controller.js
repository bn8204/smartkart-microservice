const db = require('../db');

// POST /v1/payments/process — REST fallback / admin confirm
exports.processPayment = async (req, res) => {
  const { order_id, user_id, amount, payment_method } = req.body;
  if (!order_id || !user_id || !amount)
    return res.status(400).json({ error: 'order_id, user_id, amount required' });

  // Append-only: insert a new SUCCESS event row
  const result = await db.query(
    'INSERT INTO payments (order_id, user_id, amount, status, payment_method) VALUES ($1,$2,$3,$4,$5) RETURNING *',
    [order_id, user_id, amount, 'SUCCESS', payment_method || 'CARD']
  );
  res.status(201).json(result.rows[0]);
};

// GET /v1/payments/order/:orderId
exports.getByOrder = async (req, res) => {
  const result = await db.query(
    'SELECT * FROM payments WHERE order_id = $1 ORDER BY created_at DESC',
    [req.params.orderId]
  );
  res.json(result.rows);
};

// GET /v1/payments?page=1&limit=20&sort=created_at&order=desc
exports.getAll = async (req, res) => {
  const page      = Math.max(1, parseInt(req.query.page)  || 1);
  const limit     = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
  const offset    = (page - 1) * limit;
  const validSorts = ['created_at', 'amount', 'status'];
  const sortBy    = validSorts.includes(req.query.sort) ? req.query.sort : 'created_at';
  const sortOrder = req.query.order === 'asc' ? 'ASC' : 'DESC';

  const [data, count] = await Promise.all([
    db.query(`SELECT * FROM payments ORDER BY ${sortBy} ${sortOrder} LIMIT $1 OFFSET $2`, [limit, offset]),
    db.query('SELECT COUNT(*) FROM payments')
  ]);
  const total = parseInt(count.rows[0].count);
  res.set({ 'X-Total-Count': total, 'X-Page': page, 'X-Limit': limit, 'X-Total-Pages': Math.ceil(total / limit) });
  res.json(data.rows);
};
