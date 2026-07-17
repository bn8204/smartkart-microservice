/**
 * order.controller.js — Order & Cart controller
 *
 * Sync REST: calls product-service to verify stock before checkout
 * Async event: publishes 'order.placed' to RabbitMQ after order created
 */
const axios     = require('axios');
const db        = require('../db');
const publisher = require('../publisher');
const logger    = require('../utils/logger');

const PRODUCT_URL = process.env.PRODUCT_SERVICE_URL || 'http://localhost:3002';

// ── Cart ────────────────────────────────────────────────────────────────────

// POST /v1/orders/cart/items
exports.addToCart = async (req, res) => {
  const { user_id, product_id, quantity } = req.body;
  if (!user_id || !product_id || !quantity)
    return res.status(400).json({ error: 'user_id, product_id, quantity required' });

  // Sync REST call to product-service — verify product exists & get price
  let product;
  try {
    const resp = await axios.get(`${PRODUCT_URL}/v1/products/${product_id}`, { timeout: 5000 });
    product = resp.data;
  } catch (err) {
    return res.status(404).json({ error: 'Product not found' });
  }

  // Get or create cart for user
  let cartResult = await db.query('SELECT id FROM carts WHERE user_id = $1', [user_id]);
  let cartId;
  if (cartResult.rows.length === 0) {
    const newCart = await db.query('INSERT INTO carts (user_id) VALUES ($1) RETURNING id', [user_id]);
    cartId = newCart.rows[0].id;
  } else {
    cartId = cartResult.rows[0].id;
  }

  // Upsert: if the same product is already in the cart, increment quantity instead of inserting a duplicate row
  const item = await db.query(
    `INSERT INTO cart_items (cart_id, product_id, quantity, unit_price)
     VALUES ($1,$2,$3,$4)
     ON CONFLICT (cart_id, product_id)
     DO UPDATE SET quantity   = cart_items.quantity + EXCLUDED.quantity,
                   unit_price = EXCLUDED.unit_price
     RETURNING *`,
    [cartId, product_id, quantity, product.price]
  );
  res.status(200).json(item.rows[0]);
};

// GET /v1/orders/cart/:userId
exports.getCart = async (req, res) => {
  const cartResult = await db.query('SELECT id FROM carts WHERE user_id = $1', [req.params.userId]);
  if (!cartResult.rows[0]) return res.json({ items: [], total: 0 });

  const cartId = cartResult.rows[0].id;
  const items  = await db.query(
    'SELECT ci.*, ci.unit_price FROM cart_items ci WHERE ci.cart_id = $1',
    [cartId]
  );
  const total = items.rows.reduce((sum, i) => sum + parseFloat(i.unit_price) * i.quantity, 0);
  res.json({ cartId, items: items.rows, total: total.toFixed(2) });
};

// DELETE /v1/orders/cart/items/:itemId
exports.removeCartItem = async (req, res) => {
  await db.query('DELETE FROM cart_items WHERE id = $1', [req.params.itemId]);
  res.json({ message: 'Item removed' });
};

// ── Orders ──────────────────────────────────────────────────────────────────

// POST /v1/orders/checkout
// items: [{ product_id, quantity }]  — unit_price is NEVER accepted from the client (security)
exports.checkout = async (req, res) => {
  const { user_id, shipping_address, items } = req.body;
  if (!user_id || !items || !Array.isArray(items) || items.length === 0)
    return res.status(400).json({ error: 'user_id and items array required' });

  // ── Fetch authoritative prices from product-service ──────────────────────
  // Client-supplied prices are NEVER trusted — prevents price manipulation.
  let enrichedItems;
  try {
    enrichedItems = await Promise.all(
      items.map(async (item) => {
        if (!item.product_id || !item.quantity || parseInt(item.quantity) < 1)
          throw Object.assign(
            new Error('Each item requires product_id and quantity >= 1'),
            { isClient: true }
          );
        const resp = await axios.get(`${PRODUCT_URL}/v1/products/${item.product_id}`, { timeout: 5000 });
        return {
          product_id:   item.product_id,
          product_name: resp.data.name,
          quantity:     parseInt(item.quantity),
          unit_price:   parseFloat(resp.data.price)
        };
      })
    );
  } catch (err) {
    if (err.isClient) return res.status(400).json({ error: err.message });
    const upstream = err.response?.status;
    if (upstream === 404) return res.status(404).json({ error: 'One or more products not found' });
    return res.status(502).json({ error: 'Could not verify products with product-service' });
  }

  const total = enrichedItems.reduce((sum, i) => sum + i.unit_price * i.quantity, 0);

  const client = await db.connect();
  let order;
  try {
    await client.query('BEGIN');

    const orderResult = await client.query(
      'INSERT INTO orders (user_id, total_amount, status, shipping_address) VALUES ($1,$2,$3,$4) RETURNING *',
      [user_id, total.toFixed(2), 'PENDING', shipping_address]
    );
    order = orderResult.rows[0];

    for (const item of enrichedItems) {
      await client.query(
        'INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price) VALUES ($1,$2,$3,$4,$5)',
        [order.id, item.product_id, item.product_name, item.quantity, item.unit_price]
      );
    }

    // Clear user's cart after successful checkout
    const cartResult = await client.query('SELECT id FROM carts WHERE user_id = $1', [user_id]);
    if (cartResult.rows[0]) {
      await client.query('DELETE FROM cart_items WHERE cart_id = $1', [cartResult.rows[0].id]);
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  // Sync: decrement stock in product-service — protected by internal secret header
  for (const item of enrichedItems) {
    try {
      await axios.patch(
        `${PRODUCT_URL}/v1/products/${item.product_id}/stock`,
        { delta: -item.quantity },
        { headers: { 'x-internal-secret': process.env.INTERNAL_SERVICE_SECRET || '' }, timeout: 5000 }
      );
    } catch (err) {
      logger.warn(`Stock update failed for product ${item.product_id}`, { productId: item.product_id, error: err.message });
    }
  }

  // Async: publish 'order.placed' event → payment-service processes payment
  await publisher.publishOrderPlaced({
    orderId:  order.id,
    userId:   user_id,
    amount:   total.toFixed(2),
    items:    enrichedItems
  });

  res.status(201).json({ order, total: total.toFixed(2) });
};

// GET /v1/orders?page=1&limit=20&sort=created_at&order=desc
exports.getAll = async (req, res) => {
  const page      = Math.max(1, parseInt(req.query.page)  || 1);
  const limit     = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
  const offset    = (page - 1) * limit;
  const validSorts = ['created_at', 'total_amount', 'status'];
  const sortBy    = validSorts.includes(req.query.sort) ? req.query.sort : 'created_at';
  const sortOrder = req.query.order === 'asc' ? 'ASC' : 'DESC';

  const [data, count] = await Promise.all([
    db.query(`SELECT * FROM orders ORDER BY ${sortBy} ${sortOrder} LIMIT $1 OFFSET $2`, [limit, offset]),
    db.query('SELECT COUNT(*) FROM orders')
  ]);
  const total = parseInt(count.rows[0].count);
  res.set({ 'X-Total-Count': total, 'X-Page': page, 'X-Limit': limit, 'X-Total-Pages': Math.ceil(total / limit) });
  res.json(data.rows);
};

// GET /v1/orders/my/:userId?page=1&limit=20
exports.getByUser = async (req, res) => {
  const page   = Math.max(1, parseInt(req.query.page)  || 1);
  const limit  = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
  const offset = (page - 1) * limit;

  const [data, count] = await Promise.all([
    db.query(
      'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
      [req.params.userId, limit, offset]
    ),
    db.query('SELECT COUNT(*) FROM orders WHERE user_id = $1', [req.params.userId])
  ]);

  // Attach items to each order (same shape as getById) so the UI can render them
  // without a separate round-trip per order.
  const orderIds = data.rows.map((o) => o.id);
  let itemsByOrder = {};
  if (orderIds.length > 0) {
    const items = await db.query(
      'SELECT * FROM order_items WHERE order_id = ANY($1::int[])',
      [orderIds]
    );
    itemsByOrder = items.rows.reduce((acc, item) => {
      (acc[item.order_id] = acc[item.order_id] || []).push(item);
      return acc;
    }, {});
  }
  const orders = data.rows.map((order) => ({ ...order, items: itemsByOrder[order.id] || [] }));

  const total = parseInt(count.rows[0].count);
  res.set({ 'X-Total-Count': total, 'X-Page': page, 'X-Limit': limit, 'X-Total-Pages': Math.ceil(total / limit) });
  res.json(orders);
};

// GET /v1/orders/:id
exports.getById = async (req, res) => {
  const order = await db.query('SELECT * FROM orders WHERE id = $1', [req.params.id]);
  if (!order.rows[0]) return res.status(404).json({ error: 'Order not found' });

  const items = await db.query('SELECT * FROM order_items WHERE order_id = $1', [req.params.id]);
  res.json({ ...order.rows[0], items: items.rows });
};

// PATCH /v1/orders/:id/status
exports.updateStatus = async (req, res) => {
  const { status } = req.body;
  if (!status) return res.status(400).json({ error: 'status required' });
  const result = await db.query(
    'UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
    [status, req.params.id]
  );
  if (!result.rows[0]) return res.status(404).json({ error: 'Order not found' });
  res.json(result.rows[0]);
};
