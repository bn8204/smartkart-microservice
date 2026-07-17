'use strict';
/**
 * Structured Winston logger.
 * SERVICE_NAME is read from env — set it in docker-compose per service.
 * Log files are written to ./logs/ (relative to process.cwd(), i.e. /app/logs/ in Docker).
 */
const winston = require('winston');
const path    = require('path');
const fs      = require('fs');

const SERVICE = process.env.SERVICE_NAME || 'user-service';
const LEVEL   = process.env.LOG_LEVEL    || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');
const LOG_DIR = path.join(process.cwd(), 'logs');

if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });

const { combine, timestamp, json, colorize, printf, errors } = winston.format;

const consoleFmt = printf(({ level, message, timestamp: ts, requestId, userId, ...meta }) => {
  let line = `${ts} [${SERVICE}] ${level}`;
  if (requestId) line += ` [${String(requestId).slice(0, 8)}]`;
  if (userId)    line += ` uid=${userId}`;
  line += `: ${message}`;
  const skip  = new Set(['service', 'stack', 'splat']);
  const extra = Object.entries(meta).filter(([k]) => !skip.has(k));
  if (extra.length) line += ' ' + JSON.stringify(Object.fromEntries(extra));
  return line;
});

const logger = winston.createLogger({
  level: LEVEL,
  defaultMeta: { service: SERVICE },
  format: combine(errors({ stack: true }), timestamp(), json()),
  transports: [
    new winston.transports.File({ filename: path.join(LOG_DIR, 'error.log'), level: 'error' }),
    new winston.transports.File({
      filename: path.join(LOG_DIR, 'application.log'),
      maxsize:  10 * 1024 * 1024,  // 10 MB per file
      maxFiles: 5,
      tailable: true
    }),
    new winston.transports.Console({
      format: combine(colorize({ all: true }), timestamp({ format: 'HH:mm:ss' }), consoleFmt)
    })
  ]
});

module.exports = logger;
