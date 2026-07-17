require('dotenv').config();
const express       = require('express');
const cors          = require('cors');
const bodyParser    = require('body-parser');
const swaggerUi     = require('swagger-ui-express');
const helmet        = require('helmet');
const compression   = require('compression');
const promClient    = require('prom-client');
const productRoutes = require('./routes/product.routes');
const db            = require('./db');
const config        = require('./config');
const logger        = require('./utils/logger');
const requestId     = require('./middleware/requestId');
const errorHandler  = require('./middleware/errorHandler');
const swaggerSpec   = require('./swagger/spec');

const app  = express();
const PORT = config.service.port;

// ── Security headers ──────────────────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));

// ── CORS ──────────────────────────────────────────────────────────────────────
const CORS_ORIGINS = new Set(config.cors.origins);
app.use(cors({ origin: (o, cb) => { if (!o || CORS_ORIGINS.has(o)) return cb(null,true); cb(new Error('CORS')); }, credentials: true }));
app.use(compression());
app.use(bodyParser.json({ limit: '100kb' }));
app.use(express.json({ limit: '100kb' }));
app.use(requestId);
app.use((req, res, next) => {
  const s = Date.now();
  res.on('finish', () => { const ms=Date.now()-s; const l=res.statusCode>=500?'error':res.statusCode>=400?'warn':'info'; logger[l](`${req.method} ${req.originalUrl} ${res.statusCode} ${ms}ms`,{requestId:req.requestId,status:res.statusCode,duration:ms}); });
  next();
});

// ── Prometheus metrics ─────────────────────────────────────────────────────────────────
const metricsReg = new promClient.Registry();
metricsReg.setDefaultLabels({ service: config.service.name });
promClient.collectDefaultMetrics({ register: metricsReg });
const httpDuration = new promClient.Histogram({
  name: 'http_request_duration_ms', help: 'HTTP request duration (ms)',
  labelNames: ['method', 'route', 'status'],
  buckets: [5, 10, 25, 50, 100, 250, 500, 1000],
  registers: [metricsReg]
});
app.use((req, res, next) => {
  const end = httpDuration.startTimer();
  res.on('finish', () => end({ method: req.method, route: req.route ? req.route.path : req.path, status: res.statusCode }));
  next();
});
app.get('/metrics', async (_req, res) => {
  try { res.set('Content-Type', metricsReg.contentType); res.end(await metricsReg.metrics()); }
  catch (e) { res.status(500).end(e.message); }
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { customSiteTitle: 'SmartCart Product Service API' }));

app.get('/health', async (req, res) => {
  const h = { status:'UP', service:config.service.name, version:config.service.version, uptime:Math.floor(process.uptime()), timestamp:new Date().toISOString(), checks:{} };
  try { await db.query('SELECT 1'); h.checks.database='UP'; } catch { h.checks.database='DOWN'; h.status='DEGRADED'; }
  res.status(h.status==='UP'?200:503).json(h);
});

app.use('/v1/products', productRoutes);
app.use(errorHandler);

const server = app.listen(PORT, () => logger.info(`✓ ${config.service.name} v${config.service.version} running on http://localhost:${PORT}`));

async function shutdown(signal) {
  logger.info(`${signal} received — shutting down gracefully`);
  server.close(async () => { await db.end(); logger.info('Shutdown complete'); process.exit(0); });
}
process.on('SIGINT',  () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
module.exports = app;
