const db = require('../db');

// GET /v1/products?page=1&limit=20&sort=id&order=asc
exports.getAll = async (req, res) => {
  const page      = Math.max(1, parseInt(req.query.page)  || 1);
  const limit     = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
  const offset    = (page - 1) * limit;
  const validSorts = ['id', 'name', 'price', 'created_at'];
  const sortBy    = validSorts.includes(req.query.sort) ? req.query.sort : 'id';
  const sortOrder = req.query.order === 'desc' ? 'DESC' : 'ASC';

  const [data, count] = await Promise.all([
    db.query(`SELECT * FROM products ORDER BY ${sortBy} ${sortOrder} LIMIT $1 OFFSET $2`, [limit, offset]),
    db.query('SELECT COUNT(*) FROM products')
  ]);
  const total = parseInt(count.rows[0].count);
  res.set({ 'X-Total-Count': total, 'X-Page': page, 'X-Limit': limit, 'X-Total-Pages': Math.ceil(total / limit) });
  res.json(data.rows);
};

// GET /v1/products/search?q=
exports.search = async (req, res) => {
  const q = `%${req.query.q || ''}%`;
  const result = await db.query(
    'SELECT * FROM products WHERE name ILIKE $1 OR category ILIKE $1 ORDER BY id',
    [q]
  );
  res.json(result.rows);
};

// GET /v1/products/:id
exports.getById = async (req, res) => {
  const result = await db.query('SELECT * FROM products WHERE id = $1', [req.params.id]);
  if (!result.rows[0]) return res.status(404).json({ error: 'Product not found' });
  res.json(result.rows[0]);
};

// POST /v1/products
exports.create = async (req, res) => {
  const { name, description, price, stock, category, image_url } = req.body;
  if (!name || !price) return res.status(400).json({ error: 'name and price are required' });
  const result = await db.query(
    'INSERT INTO products (name, description, price, stock, category, image_url) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
    [name, description, price, stock || 0, category, image_url]
  );
  res.status(201).json(result.rows[0]);
};

// PATCH /v1/products/:id/stock  — body: { delta: -N } to decrement
exports.updateStock = async (req, res) => {
  const { delta } = req.body;
  if (delta === undefined) return res.status(400).json({ error: 'delta required' });
  const result = await db.query(
    'UPDATE products SET stock = stock + $1, updated_at = NOW() WHERE id = $2 RETURNING id, stock',
    [delta, req.params.id]
  );
  if (!result.rows[0]) return res.status(404).json({ error: 'Product not found' });
  res.json(result.rows[0]);
};
