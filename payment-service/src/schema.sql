-- sc_payments schema (payment-service owns this DB)
-- Append-only event log — implements Event Sourcing pattern

CREATE TABLE IF NOT EXISTS payments (
  id             SERIAL PRIMARY KEY,
  order_id       INT           NOT NULL,  -- logical ref, no cross-DB FK
  user_id        INT           NOT NULL,
  amount         DECIMAL(10,2) NOT NULL,
  status         VARCHAR(50)   DEFAULT 'PENDING',  -- PENDING | SUCCESS | FAILED
  payment_method VARCHAR(50)   DEFAULT 'CARD',
  created_at     TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);

-- Each row is an immutable event — no UPDATEs on existing rows
CREATE INDEX IF NOT EXISTS idx_payments_order  ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_user   ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
