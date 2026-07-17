const { Pool } = require('pg');

const pool = new Pool({
  host:     process.env.PG_HOST     || 'localhost',
  port:     parseInt(process.env.PG_PORT || '5432'),
  user:     process.env.PG_USER     || 'postgres',
  password: process.env.PG_PASSWORD || '',
  database: process.env.PG_DBNAME   || 'sc_payments',
  max: 10,
  idleTimeoutMillis: 30000,
});

module.exports = pool;
