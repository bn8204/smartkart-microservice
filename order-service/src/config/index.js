'use strict';
const pkg = require('../../package.json');

module.exports = {
  service: {
    name:    process.env.SERVICE_NAME || 'order-service',
    version: pkg.version             || '1.0.0',
    env:     process.env.NODE_ENV    || 'development',
    port:    Number(process.env.PORT) || 3003
  },
  db: {
    host:              process.env.PG_HOST     || 'localhost',
    port:              Number(process.env.PG_PORT) || 5432,
    user:              process.env.PG_USER     || 'postgres',
    password:          process.env.PG_PASSWORD || '',
    database:          process.env.PG_DBNAME   || 'sc_orders',
    max:               10,
    idleTimeoutMillis: 30000
  },
  cors: {
    origins: (process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:8080').split(',').map(s => s.trim())
  },
  log: {
    level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug')
  }
};
