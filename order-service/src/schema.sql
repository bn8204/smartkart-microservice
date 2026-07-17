-- sc_orders schema (order-service owns this DB)
-- Note: user_id and product_id are foreign keys by value only —
--       no cross-DB FK constraints (Database-per-Microservice pattern)

CREATE TABLE IF NOT EXISTS carts (
  id         SERIAL PRIMARY KEY,
  user_id    INT       NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cart_items (
  id         SERIAL PRIMARY KEY,
  cart_id    INT           NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_id INT           NOT NULL,
  quantity   INT           NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  added_at   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (cart_id, product_id)          -- enables upsert (ON CONFLICT) in addToCart
);

CREATE TABLE IF NOT EXISTS orders (
  id               SERIAL PRIMARY KEY,
  user_id          INT           NOT NULL,
  total_amount     DECIMAL(10,2) NOT NULL,
  status           VARCHAR(50)   DEFAULT 'PENDING',
  shipping_address TEXT,
  created_at       TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_items (
  id         SERIAL PRIMARY KEY,
  order_id   INT           NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INT           NOT NULL,
  product_name VARCHAR(255),
  quantity   INT           NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_orders_user    ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status  ON orders(status);
CREATE INDEX IF NOT EXISTS idx_carts_user     ON carts(user_id);
