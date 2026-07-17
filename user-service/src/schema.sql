-- sc_users schema (user-service owns this DB)

CREATE TABLE IF NOT EXISTS users (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(255) NOT NULL,
  email      VARCHAR(255) UNIQUE NOT NULL,
  password   VARCHAR(255) NOT NULL,    -- bcrypt hash
  role       VARCHAR(50)  DEFAULT 'user',
  created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- Index for fast login lookup by email
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
-- Index for role-based queries (e.g., admin dashboards)
CREATE INDEX IF NOT EXISTS idx_users_role  ON users(role);
