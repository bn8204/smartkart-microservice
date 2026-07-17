-- sc_products schema (product-service owns this DB)

CREATE TABLE IF NOT EXISTS products (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(255)   NOT NULL,
  description TEXT,
  price       DECIMAL(10,2)  NOT NULL,
  stock       INTEGER        DEFAULT 0,
  category    VARCHAR(100),
  image_url   VARCHAR(500),
  created_at  TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP      DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for search and filter performance
CREATE INDEX IF NOT EXISTS idx_products_category   ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_price      ON products(price);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at);
-- Partial index: only in-stock products (common filter)
CREATE INDEX IF NOT EXISTS idx_products_in_stock   ON products(id) WHERE stock > 0;

-- Seed: sample products
INSERT INTO products (name, description, price, stock, category) VALUES
  ('Wireless Headphones', 'Noise-cancelling over-ear headphones', 79.99, 50, 'Electronics'),
  ('Running Shoes',       'Lightweight mesh running shoes',        49.99, 100, 'Footwear'),
  ('Coffee Maker',        '12-cup programmable coffee maker',      39.99, 30, 'Appliances'),
  ('Yoga Mat',            'Non-slip 6mm thick yoga mat',           24.99, 75, 'Sports'),
  ('Backpack',            '30L waterproof hiking backpack',        59.99, 40, 'Bags')
ON CONFLICT DO NOTHING;
